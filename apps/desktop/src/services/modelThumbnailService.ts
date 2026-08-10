import { invoke } from "@tauri-apps/api/core";

import {
    AmbientLight,
    Box3,
    Color,
    DirectionalLight,
    Group,
    Mesh,
    MeshStandardMaterial,
    Object3D,
    PerspectiveCamera,
    Scene,
    Sphere,
    Vector3,
    WebGLRenderer,
} from "three";

import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

const THUMBNAIL_SIZE = 512;

function createRenderer(): WebGLRenderer {
    const renderer = new WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
    });

    renderer.setSize(
        THUMBNAIL_SIZE,
        THUMBNAIL_SIZE,
        false,
    );

    renderer.setPixelRatio(1);

    renderer.setClearColor(
        new Color("#18181b"),
        1,
    );

    return renderer;
}

function createScene(): Scene {
    const scene = new Scene();

    const ambientLight =
        new AmbientLight("#ffffff", 2);

    scene.add(ambientLight);

    const keyLight =
        new DirectionalLight("#ffffff", 3);

    keyLight.position.set(4, 6, 5);

    scene.add(keyLight);

    const fillLight =
        new DirectionalLight("#ffffff", 1.5);

    fillLight.position.set(-4, 2, -3);

    scene.add(fillLight);

    return scene;
}

function prepareObject(
    object: Object3D,
): void {
    object.traverse((child) => {
        if (!(child instanceof Mesh)) {
            return;
        }

        child.castShadow = false;
        child.receiveShadow = false;

        /*
         * OBJ files may already contain usable materials.
         * Preserve those when possible.
         */
        if (!child.material) {
            child.material =
                new MeshStandardMaterial({
                    color: "#e4e4e7",
                    roughness: 0.55,
                    metalness: 0.05,
                });
        }
    });
}

function fitCameraToObject(
    camera: PerspectiveCamera,
    object: Object3D,
): void {
    const box =
        new Box3().setFromObject(object);

    if (box.isEmpty()) {
        camera.position.set(3, 3, 3);
        camera.lookAt(0, 0, 0);

        return;
    }

    const sphere = new Sphere();

    box.getBoundingSphere(sphere);

    const center =
        sphere.center;

    const radius =
        Math.max(
            sphere.radius,
            0.001,
        );

    /*
     * Move the model center to world origin.
     */
    object.position.sub(center);

    /*
     * Three-quarter camera angle.
     */
    const direction =
        new Vector3(
            1,
            0.8,
            1,
        ).normalize();

    const fovRadians =
        (camera.fov * Math.PI) /
        180;

    const distance =
        radius /
        Math.sin(
            fovRadians / 2,
        );

    camera.position.copy(
        direction.multiplyScalar(
            distance * 1.15,
        ),
    );

    camera.near =
        Math.max(
            distance / 100,
            0.01,
        );

    camera.far =
        Math.max(
            distance * 100,
            1000,
        );

    camera.updateProjectionMatrix();

    camera.lookAt(
        0,
        0,
        0,
    );
}

async function loadStl(
    url: string,
): Promise<Object3D> {
    const loader =
        new STLLoader();

    const geometry =
        await loader.loadAsync(url);

    geometry.computeVertexNormals();

    const material =
        new MeshStandardMaterial({
            color: "#e4e4e7",
            roughness: 0.55,
            metalness: 0.05,
        });

    const mesh =
        new Mesh(
            geometry,
            material,
        );

    return mesh;
}

async function loadObj(
    url: string,
): Promise<Object3D> {
    const loader =
        new OBJLoader();

    return loader.loadAsync(url);
}

async function loadModel(
    url: string,
    extension: string,
): Promise<Object3D> {
    const ext =
        extension.toUpperCase();

    if (ext === "STL") {
        return loadStl(url);
    }

    if (ext === "OBJ") {
        return loadObj(url);
    }

    throw new Error(
        `Thumbnail generation is not supported for ${extension}`,
    );
}

function canvasToBlob(
    canvas: HTMLCanvasElement,
): Promise<Blob> {
    return new Promise(
        (
            resolve,
            reject,
        ) => {
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(
                            new Error(
                                "Unable to create thumbnail image.",
                            ),
                        );

                        return;
                    }

                    resolve(blob);
                },
                "image/png",
            );
        },
    );
}

function disposeObject(
    object: Object3D,
): void {
    object.traverse(
        (child) => {
            if (
                !(child instanceof Mesh)
            ) {
                return;
            }

            child.geometry?.dispose();

            if (
                Array.isArray(
                    child.material,
                )
            ) {
                child.material.forEach(
                    (material) => {
                        material.dispose();
                    },
                );
            } else {
                child.material?.dispose();
            }
        },
    );
}

/*
 * Generates a PNG thumbnail entirely in memory.
 */
export async function generateModelThumbnail(
    modelUrl: string,
    extension: string,
): Promise<Blob> {
    const renderer =
        createRenderer();

    const scene =
        createScene();

    const camera =
        new PerspectiveCamera(
            35,
            1,
            0.01,
            10000,
        );

    const root =
        new Group();

    scene.add(root);

    let model:
        | Object3D
        | null = null;

    try {
        model =
            await loadModel(
                modelUrl,
                extension,
            );

        prepareObject(model);

        root.add(model);

        fitCameraToObject(
            camera,
            root,
        );

        renderer.render(
            scene,
            camera,
        );

        return await canvasToBlob(
            renderer.domElement,
        );
    } finally {
        if (model) {
            disposeObject(model);
        }

        renderer.dispose();
        renderer.forceContextLoss();
    }
}

/*
 * Saves the generated PNG through the
 * Rust/Tauri save_model_thumbnail command.
 *
 * Rust stores it inside PrintVault's
 * application cache directory.
 */
export async function saveModelThumbnailToCache(
    assetId: number,
    blob: Blob,
): Promise<string> {
    const buffer =
        await blob.arrayBuffer();

    const bytes =
        Array.from(
            new Uint8Array(
                buffer,
            ),
        );

    const thumbnailPath =
        await invoke<string>(
            "save_model_thumbnail",
            {
                assetId,
                bytes,
            },
        );

    return thumbnailPath;
}

/*
 * Temporary in-memory thumbnail URL.
 *
 * Keeping this available for debugging
 * or places where persistence is not needed.
 */
export async function generateModelThumbnailUrl(
    modelUrl: string,
    extension: string,
): Promise<string> {
    const blob =
        await generateModelThumbnail(
            modelUrl,
            extension,
        );

    return URL.createObjectURL(
        blob,
    );
}

export function revokeModelThumbnailUrl(
    url: string | null,
): void {
    if (
        url &&
        url.startsWith("blob:")
    ) {
        URL.revokeObjectURL(
            url,
        );
    }
}
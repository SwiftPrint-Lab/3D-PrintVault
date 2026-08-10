import { useEffect } from "react";
import { useLoader } from "@react-three/fiber";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import {
    Mesh,
    MeshStandardMaterial,
    Object3D,
} from "three";

interface ObjModelProps {
    url: string;
}

export function ObjModel({
    url,
}: ObjModelProps) {
    const object = useLoader(OBJLoader, url);

    useEffect(() => {
        object.traverse((child: Object3D) => {
            if (child instanceof Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                if (!child.material) {
                    child.material = new MeshStandardMaterial({
                        color: "#b6b6b6",
                        roughness: 0.55,
                        metalness: 0.08,
                    });
                }
            }
        });
    }, [object]);

    return <primitive object={object} />;
}
import {
    Component,
    Suspense,
    type ErrorInfo,
    type ReactNode,
} from "react";
import { Canvas } from "@react-three/fiber";
import {
    Bounds,
    Center,
    OrbitControls,
} from "@react-three/drei";

import { StlModel } from "./StlModel";
import { ObjModel } from "./ObjModel";
import { ThreeMfModel } from "./ThreeMfModel";

interface ModelViewerProps {
    url: string;
    extension: string;
    interactive?: boolean;
}

export function ModelViewer({
    url,
    extension,
    interactive = false,
}: ModelViewerProps) {
    const format = extension.toUpperCase();

    function renderModel() {
        switch (format) {
            case "STL":
                return <StlModel url={url} />;

            case "OBJ":
                return <ObjModel url={url} />;

            case "3MF":
                return <ThreeMfModel url={url} />;

            default:
                return null;
        }
    }

    return (
        <ModelErrorBoundary>
          <div className="h-full w-full overflow-hidden">
            <Canvas
                camera={{
                    position: [3, 3, 3],
                    fov: 40,
                }}
                dpr={[1, 1.5]}
                gl={{
                    antialias: true,
                    alpha: true,
                }}
            >
                <ambientLight intensity={1.2} />

                <directionalLight
                    position={[4, 6, 5]}
                    intensity={2.5}
                />

                <directionalLight
                    position={[-4, 2, -3]}
                    intensity={1}
                />

                <Suspense fallback={null}>
                    <Bounds
                        fit
                        clip
                        observe
                        margin={1.25}
                    >
                        <Center>
                            {renderModel()}
                        </Center>
                    </Bounds>

                    {/* Local lighting only.
                        Avoid remote HDR environment assets so
                        packaged Tauri builds remain CSP-safe. */}
                </Suspense>

                {interactive && (
                    <OrbitControls
                        makeDefault
                        enablePan={false}
                        enableDamping
                        dampingFactor={0.08}
                        minDistance={0.5}
                        maxDistance={20}
                    />
                )}
            </Canvas>
          </div>
        </ModelErrorBoundary>
    );
}

interface ModelErrorBoundaryProps {
    children: ReactNode;
}

interface ModelErrorBoundaryState {
    failed: boolean;
}

class ModelErrorBoundary extends Component<
    ModelErrorBoundaryProps,
    ModelErrorBoundaryState
> {
    state: ModelErrorBoundaryState = {
        failed: false,
    };

    static getDerivedStateFromError(): ModelErrorBoundaryState {
        return { failed: true };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error("Failed to render 3D preview", error, info);
    }

    render() {
        if (this.state.failed) {
            return (
                <div className="flex h-full w-full items-center justify-center px-6 text-center text-xs text-zinc-500">
                    This model could not be previewed.
                </div>
            );
        }

        return this.props.children;
    }
}

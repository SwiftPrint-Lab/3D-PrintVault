import { useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { MeshStandardMaterial } from "three";

interface StlModelProps {
    url: string;
}

export function StlModel({
    url,
}: StlModelProps) {
    const geometry = useLoader(STLLoader, url);

    const material = useMemo(
        () =>
            new MeshStandardMaterial({
                color: "#b6b6b6",
                roughness: 0.55,
                metalness: 0.08,
            }),
        [],
    );

    return (
        <mesh
            geometry={geometry}
            material={material}
            castShadow
            receiveShadow
        />
    );
}
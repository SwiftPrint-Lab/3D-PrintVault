import { useEffect } from "react";
import { useLoader } from "@react-three/fiber";
import { ThreeMFLoader } from "three/examples/jsm/loaders/3MFLoader.js";
import {
  Mesh,
  Object3D,
} from "three";

interface ThreeMfModelProps {
  url: string;
}

export function ThreeMfModel({
  url,
}: ThreeMfModelProps) {
  const object = useLoader(ThreeMFLoader, url);

  useEffect(() => {
    object.traverse((child: Object3D) => {
      if (child instanceof Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;

      }
    });
  }, [object]);

  return (
    <primitive
      object={object}
      rotation={[-Math.PI / 2, 0, 0]}
    />
  );
}

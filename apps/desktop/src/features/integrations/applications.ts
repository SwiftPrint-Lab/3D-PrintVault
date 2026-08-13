export type ApplicationCategory =
    | "slicer"
    | "modeling"
    | "cad";

export interface ExternalApplication {
    id: string;
    label: string;
    category: ApplicationCategory;
    extensions: string[];

    /*
     * Names/hints used by platform-specific detection.
     * These are NOT absolute user-specific paths.
     */
    macAppNames: string[];
}

export const externalApplications: ExternalApplication[] = [
    {
        id: "bambu-studio",
        label: "Bambu Studio",
        category: "slicer",
        macAppNames: [
            "BambuStudio.app",
            "Bambu Studio.app",
        ],
        extensions: [
            "STL",
            "OBJ",
            "3MF",
            "STEP",
            "STP",
        ],
    },
    {
        id: "orca-slicer",
        label: "OrcaSlicer",
        category: "slicer",
        macAppNames: [
            "OrcaSlicer.app",
        ],
        extensions: [
            "STL",
            "OBJ",
            "3MF",
            "STEP",
            "STP",
        ],
    },
    {
        id: "prusa-slicer",
        label: "PrusaSlicer",
        category: "slicer",
        macAppNames: [
            "PrusaSlicer.app",
        ],
        extensions: [
            "STL",
            "OBJ",
            "3MF",
            "STEP",
            "STP",
        ],
    },
    {
        id: "cura",
        label: "UltiMaker Cura",
        category: "slicer",
        macAppNames: [
            "UltiMaker Cura.app",
            "Cura.app",
        ],
        extensions: [
            "STL",
            "OBJ",
            "3MF",
        ],
    },
    {
        id: "creality-print",
        label: "Creality Print",
        category: "slicer",
        macAppNames: [
            "Creality Print.app",
        ],
        extensions: [
            "STL",
            "OBJ",
            "3MF",
        ],
    },
    {
        id: "qidi-studio",
        label: "QIDI Studio",
        category: "slicer",
        macAppNames: [
            "QIDIStudio.app",
            "QIDI Studio.app",
        ],
        extensions: [
            "STL",
            "OBJ",
            "3MF",
        ],
    },
    {
        id: "flashprint",
        label: "FlashPrint",
        category: "slicer",
        macAppNames: [
            "FlashPrint.app",
        ],
        extensions: [
            "STL",
            "OBJ",
            "3MF",
        ],
    },
    {
        id: "ideamaker",
        label: "ideaMaker",
        category: "slicer",
        macAppNames: [
            "ideaMaker.app",
        ],
        extensions: [
            "STL",
            "OBJ",
            "3MF",
        ],
    },
    {
        id: "blender",
        label: "Blender",
        category: "modeling",
        macAppNames: [
            "Blender.app",
        ],
        extensions: [
            "STL",
            "OBJ",
            "PLY",
            "FBX",
            "GLB",
            "GLTF",
        ],
    },
    {
        id: "zbrush",
        label: "ZBrush",
        category: "modeling",
        macAppNames: [
            "ZBrush.app",
            "ZBrush 2026.app",
        ],
        extensions: [
            "STL",
            "OBJ",
            "FBX",
        ],
    },
    {
        id: "fusion",
        label: "Autodesk Fusion",
        category: "cad",
        macAppNames: [
            "Autodesk Fusion.app",
        ],
        extensions: [
            "STL",
            "OBJ",
            "STEP",
            "STP",
            "IGES",
            "IGS",
            "F3D",
            "F3Z",
        ],
    },
];

export function getCompatibleApplications(
    extension: string,
): ExternalApplication[] {
    const normalized =
        extension.toUpperCase();

    return externalApplications.filter(
        (application) =>
            application.extensions.includes(
                normalized,
            ),
    );
}
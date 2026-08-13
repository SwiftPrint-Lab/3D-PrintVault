export type FabricationTechnology =
    | "FDM / FFF"
    | "Resin"
    | "Laser"
    | "CAD";

export interface Asset {
    id: number;
    name: string;
    extension: string;
    technology: FabricationTechnology;

    size: string;
    sizeBytes?: number;

    modified: string;
    modifiedAt?: string;

    path?: string;

    thumbnailPath?: string;

    favorite?: boolean;

    lastOpenedAt?: string;
}
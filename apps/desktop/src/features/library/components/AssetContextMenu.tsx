import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    revealItemInDir,
} from "@tauri-apps/plugin-opener";

import {
    FiBox,
    FiCheck,
    FiExternalLink,
    FiFolder,
    FiHeart,
    FiLayers,
    FiPlus,
    FiTrash2,
    FiX,
} from "react-icons/fi";

import type {
    Asset,
} from "../types/asset";

import type {
    Collection,
    Project,
} from "../../../services/databaseService";

import {
    getCompatibleApplications,
} from "../../integrations/applications";

import {
    useInstalledApplications,
} from "../../integrations/hooks/useInstalledApplications";

import {
    chooseApplicationForAsset,
    openAssetInApplication,
} from "../../integrations/openWithService";

interface AssetContextMenuProps {
    asset: Asset;

    x: number;
    y: number;

    onClose: () => void;

    onSelect: (
        asset: Asset,
    ) => void;

    onDelete: (
        asset: Asset,
    ) => void;

    onUpdateFavorite: (
        asset: Asset,
        favorite: boolean,
    ) => void;

    /*
     * Collections
     */

    collections: Collection[];

    onAddToCollection: (
        asset: Asset,
        collection: Collection,
    ) => Promise<void>;

    onCreateCollection: (
        name: string,
    ) => Promise<Collection | null>;

    onRemoveFromCollection?: (
        asset: Asset,
    ) => Promise<void>;

    /*
     * Projects
     */

    projects: Project[];

    onAddToProject: (
        asset: Asset,
        project: Project,
    ) => Promise<void>;

    onCreateProject: (
        name: string,
        description: string,
    ) => Promise<Project | null>;

    onRemoveFromProject?: (
        asset: Asset,
    ) => Promise<void>;
}

export function AssetContextMenu({
    asset,
    x,
    y,
    onClose,
    onSelect,
    onDelete,
    onUpdateFavorite,

    collections,
    onAddToCollection,
    onCreateCollection,
    onRemoveFromCollection,

    projects,
    onAddToProject,
    onCreateProject,
    onRemoveFromProject,
}: AssetContextMenuProps) {
    const menuRef =
        useRef<HTMLDivElement | null>(
            null,
        );

    /*
     * ---------------------------------------------------------
     * COLLECTION STATE
     * ---------------------------------------------------------
     */

    const [
        showCollections,
        setShowCollections,
    ] = useState(false);

    const [
        creatingCollection,
        setCreatingCollection,
    ] = useState(false);

    const [
        newCollectionName,
        setNewCollectionName,
    ] = useState("");

    const [
        addingCollectionId,
        setAddingCollectionId,
    ] = useState<number | null>(
        null,
    );

    /*
     * ---------------------------------------------------------
     * PROJECT STATE
     * ---------------------------------------------------------
     */

    const [
        showProjects,
        setShowProjects,
    ] = useState(false);

    const [
        creatingProject,
        setCreatingProject,
    ] = useState(false);

    const [
        newProjectName,
        setNewProjectName,
    ] = useState("");

    const [
        addingProjectId,
        setAddingProjectId,
    ] = useState<number | null>(
        null,
    );

    /*
     * ---------------------------------------------------------
     * APPLICATIONS
     * ---------------------------------------------------------
     */

    const applications =
        getCompatibleApplications(
            asset.extension,
        );

    const {
        installedById,
        loading,
    } = useInstalledApplications();

    const availableApplications =
        applications.filter(
            (application) => {
                const detected =
                    installedById.get(
                        application.id,
                    );

                return (
                    detected?.installed &&
                    Boolean(
                        detected.path,
                    )
                );
            },
        );

    /*
     * ---------------------------------------------------------
     * CLOSE / ESCAPE
     * ---------------------------------------------------------
     */

    useEffect(() => {
        function handlePointerDown(
            event: MouseEvent,
        ) {
            if (
                menuRef.current &&
                !menuRef.current.contains(
                    event.target as Node,
                )
            ) {
                onClose();
            }
        }

        function handleEscape(
            event: KeyboardEvent,
        ) {
            if (
                event.key !==
                "Escape"
            ) {
                return;
            }

            if (
                creatingCollection
            ) {
                setCreatingCollection(
                    false,
                );

                setNewCollectionName(
                    "",
                );

                return;
            }

            if (
                creatingProject
            ) {
                setCreatingProject(
                    false,
                );

                setNewProjectName(
                    "",
                );

                return;
            }

            if (
                showCollections
            ) {
                setShowCollections(
                    false,
                );

                return;
            }

            if (
                showProjects
            ) {
                setShowProjects(
                    false,
                );

                return;
            }

            onClose();
        }

        window.addEventListener(
            "mousedown",
            handlePointerDown,
        );

        window.addEventListener(
            "keydown",
            handleEscape,
        );

        return () => {
            window.removeEventListener(
                "mousedown",
                handlePointerDown,
            );

            window.removeEventListener(
                "keydown",
                handleEscape,
            );
        };
    }, [
        onClose,
        creatingCollection,
        creatingProject,
        showCollections,
        showProjects,
    ]);

    /*
     * ---------------------------------------------------------
     * OPEN
     * ---------------------------------------------------------
     */

    function handleOpen() {
        onSelect(
            asset,
        );

        onClose();
    }

    async function handleOpenInApplication(
        applicationId: string,
    ) {
        if (
            !asset.path
        ) {
            return;
        }

        const application =
            applications.find(
                (item) =>
                    item.id ===
                    applicationId,
            );

        if (
            !application
        ) {
            return;
        }

        const detected =
            installedById.get(
                application.id,
            );

        if (
            !detected?.installed ||
            !detected.path
        ) {
            alert(
                `${application.label} is not installed or could not be detected.`,
            );

            return;
        }

        try {
            await openAssetInApplication(
                asset.path,
                detected.path,
            );

            onClose();
        } catch (error) {
            console.error(
                `Failed to open asset in ${application.label}:`,
                error,
            );

            alert(
                `Unable to open in ${application.label}: ${String(error)}`,
            );
        }
    }

    async function handleChooseApplication() {
        if (
            !asset.path
        ) {
            return;
        }

        try {
            await chooseApplicationForAsset(
                asset.path,
            );

            onClose();
        } catch (error) {
            console.error(
                "Failed to choose application:",
                error,
            );

            alert(
                `Unable to choose application: ${String(error)}`,
            );
        }
    }

    /*
     * ---------------------------------------------------------
     * FINDER
     * ---------------------------------------------------------
     */

    async function handleRevealInFinder() {
        if (
            !asset.path
        ) {
            return;
        }

        try {
            await revealItemInDir(
                asset.path,
            );

            onClose();
        } catch (error) {
            console.error(
                "Failed to reveal asset in Finder:",
                error,
            );

            alert(
                `Unable to reveal file in Finder: ${String(error)}`,
            );
        }
    }

    /*
     * ---------------------------------------------------------
     * FAVORITES
     * ---------------------------------------------------------
     */

    function handleFavorite() {
        const nextFavorite =
            !asset.favorite;

        onUpdateFavorite(
            asset,
            nextFavorite,
        );

        onClose();
    }

    /*
     * ---------------------------------------------------------
     * COLLECTIONS
     * ---------------------------------------------------------
     */

    async function handleAddToCollection(
        collection: Collection,
    ) {
        try {
            setAddingCollectionId(
                collection.id,
            );

            await onAddToCollection(
                asset,
                collection,
            );

            onClose();
        } catch (error) {
            console.error(
                "Failed to add asset to collection:",
                error,
            );

            alert(
                `Unable to add asset to collection: ${String(error)}`,
            );
        } finally {
            setAddingCollectionId(
                null,
            );
        }
    }

    async function handleCreateCollection() {
        const trimmedName =
            newCollectionName.trim();

        if (
            !trimmedName
        ) {
            return;
        }

        try {
            const collection =
                await onCreateCollection(
                    trimmedName,
                );

            if (
                !collection
            ) {
                return;
            }

            await onAddToCollection(
                asset,
                collection,
            );

            setNewCollectionName(
                "",
            );

            setCreatingCollection(
                false,
            );

            onClose();
        } catch (error) {
            console.error(
                "Failed to create collection:",
                error,
            );

            alert(
                `Unable to create collection: ${String(error)}`,
            );
        }
    }

    async function handleRemoveFromCollection() {
        if (
            !onRemoveFromCollection
        ) {
            return;
        }

        try {
            await onRemoveFromCollection(
                asset,
            );

            onClose();
        } catch (error) {
            console.error(
                "Failed to remove asset from collection:",
                error,
            );
        }
    }

    /*
     * ---------------------------------------------------------
     * PROJECTS
     * ---------------------------------------------------------
     */

    async function handleAddToProject(
        project: Project,
    ) {
        try {
            setAddingProjectId(
                project.id,
            );

            await onAddToProject(
                asset,
                project,
            );

            onClose();
        } catch (error) {
            console.error(
                "Failed to add asset to project:",
                error,
            );

            alert(
                `Unable to add asset to project: ${String(error)}`,
            );
        } finally {
            setAddingProjectId(
                null,
            );
        }
    }

    async function handleCreateProject() {
        const trimmedName =
            newProjectName.trim();

        if (
            !trimmedName
        ) {
            return;
        }

        try {
            const project =
                await onCreateProject(
                    trimmedName,
                    "",
                );

            if (
                !project
            ) {
                return;
            }

            await onAddToProject(
                asset,
                project,
            );

            setNewProjectName(
                "",
            );

            setCreatingProject(
                false,
            );

            onClose();
        } catch (error) {
            console.error(
                "Failed to create project:",
                error,
            );

            alert(
                `Unable to create project: ${String(error)}`,
            );
        }
    }

    async function handleRemoveFromProject() {
        if (
            !onRemoveFromProject
        ) {
            return;
        }

        try {
            await onRemoveFromProject(
                asset,
            );

            onClose();
        } catch (error) {
            console.error(
                "Failed to remove asset from project:",
                error,
            );
        }
    }

    /*
     * ---------------------------------------------------------
     * DELETE
     * ---------------------------------------------------------
     */

    function handleDelete() {
        onClose();

        onDelete(
            asset,
        );
    }

    /*
     * ---------------------------------------------------------
     * POSITION
     * ---------------------------------------------------------
     */

    const safeX =
        Math.min(
            x,
            window.innerWidth - 300,
        );

    const safeY =
        Math.min(
            y,
            window.innerHeight - 760,
        );

    return (
        <div
            ref={
                menuRef
            }
            className="fixed z-[1000] w-72 overflow-hidden rounded-xl border border-white/10 bg-zinc-950/95 p-1.5 shadow-2xl backdrop-blur-xl"
            style={{
                left: Math.max(
                    8,
                    safeX,
                ),
                top: Math.max(
                    8,
                    safeY,
                ),
            }}
        >
            <div className="flex items-center justify-between border-b border-white/10 px-2 py-2">
                <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-zinc-200">
                        {
                            asset.name
                        }
                    </p>

                    <p className="mt-0.5 text-[10px] text-zinc-600">
                        {
                            asset.extension
                        }{" "}
                        •{" "}
                        {
                            asset.size
                        }
                    </p>
                </div>

                <button
                    type="button"
                    onClick={
                        onClose
                    }
                    className="ml-2 rounded-md p-1 text-zinc-600 transition hover:bg-white/5 hover:text-white"
                >
                    <FiX />
                </button>
            </div>

            <div className="max-h-[80vh] overflow-y-auto py-1">
                <MenuButton
                    icon={
                        <FiBox />
                    }
                    label="Open"
                    onClick={
                        handleOpen
                    }
                />

                {applications.length >
                    0 && (
                        <>
                            <Divider />

                            <SectionLabel>
                                Open With
                            </SectionLabel>

                            {loading ? (
                                <div className="px-3 py-2 text-xs text-zinc-600">
                                    Detecting applications…
                                </div>
                            ) : (
                                <>
                                    {availableApplications.map(
                                        (
                                            application,
                                        ) => (
                                            <MenuButton
                                                key={
                                                    application.id
                                                }
                                                icon={
                                                    <FiExternalLink />
                                                }
                                                label={
                                                    application.label
                                                }
                                                disabled={
                                                    !asset.path
                                                }
                                                onClick={() =>
                                                    void handleOpenInApplication(
                                                        application.id,
                                                    )
                                                }
                                            />
                                        ),
                                    )}

                                    {availableApplications.length ===
                                        0 && (
                                            <div className="px-3 py-2 text-xs text-zinc-600">
                                                No compatible installed applications detected.
                                            </div>
                                        )}
                                </>
                            )}

                            <MenuButton
                                icon={
                                    <FiExternalLink />
                                }
                                label="Choose Application…"
                                disabled={
                                    !asset.path
                                }
                                onClick={() =>
                                    void handleChooseApplication()
                                }
                            />
                        </>
                    )}

                <Divider />

                <MenuButton
                    icon={
                        <FiFolder />
                    }
                    label="Reveal in Finder"
                    disabled={
                        !asset.path
                    }
                    onClick={() =>
                        void handleRevealInFinder()
                    }
                />

                <MenuButton
                    icon={
                        <FiHeart />
                    }
                    label={
                        asset.favorite
                            ? "Remove from Favorites"
                            : "Add to Favorites"
                    }
                    onClick={
                        handleFavorite
                    }
                />

                <Divider />

                <MenuButton
                    icon={
                        <FiLayers />
                    }
                    label={
                        showCollections
                            ? "Hide Collections"
                            : "Add to Collection"
                    }
                    onClick={() => {
                        setShowProjects(
                            false,
                        );

                        setShowCollections(
                            (current) =>
                                !current,
                        );
                    }}
                />

                {showCollections && (
                    <div className="my-1 rounded-lg border border-white/10 bg-black/20 p-1">
                        {collections.length >
                            0 ? (
                            <div className="max-h-40 overflow-y-auto">
                                {collections.map(
                                    (
                                        collection,
                                    ) => (
                                        <PickerButton
                                            key={
                                                collection.id
                                            }
                                            label={
                                                collection.name
                                            }
                                            loading={
                                                addingCollectionId ===
                                                collection.id
                                            }
                                            onClick={() =>
                                                void handleAddToCollection(
                                                    collection,
                                                )
                                            }
                                        />
                                    ),
                                )}
                            </div>
                        ) : (
                            <EmptyPickerLabel>
                                No collections yet.
                            </EmptyPickerLabel>
                        )}

                        <Divider />

                        {!creatingCollection ? (
                            <MenuButton
                                icon={
                                    <FiPlus />
                                }
                                label="New Collection"
                                onClick={() =>
                                    setCreatingCollection(
                                        true,
                                    )
                                }
                            />
                        ) : (
                            <CreateInline
                                value={
                                    newCollectionName
                                }
                                placeholder="Collection name"
                                actionLabel="Create & Add"
                                onChange={
                                    setNewCollectionName
                                }
                                onSubmit={
                                    handleCreateCollection
                                }
                                onCancel={() => {
                                    setCreatingCollection(
                                        false,
                                    );

                                    setNewCollectionName(
                                        "",
                                    );
                                }}
                            />
                        )}
                    </div>
                )}

                <MenuButton
                    icon={
                        <FiFolder />
                    }
                    label={
                        showProjects
                            ? "Hide Projects"
                            : "Add to Project"
                    }
                    onClick={() => {
                        setShowCollections(
                            false,
                        );

                        setShowProjects(
                            (current) =>
                                !current,
                        );
                    }}
                />

                {showProjects && (
                    <div className="my-1 rounded-lg border border-white/10 bg-black/20 p-1">
                        {projects.length >
                            0 ? (
                            <div className="max-h-40 overflow-y-auto">
                                {projects.map(
                                    (
                                        project,
                                    ) => (
                                        <PickerButton
                                            key={
                                                project.id
                                            }
                                            label={
                                                project.name
                                            }
                                            loading={
                                                addingProjectId ===
                                                project.id
                                            }
                                            onClick={() =>
                                                void handleAddToProject(
                                                    project,
                                                )
                                            }
                                        />
                                    ),
                                )}
                            </div>
                        ) : (
                            <EmptyPickerLabel>
                                No projects yet.
                            </EmptyPickerLabel>
                        )}

                        <Divider />

                        {!creatingProject ? (
                            <MenuButton
                                icon={
                                    <FiPlus />
                                }
                                label="New Project"
                                onClick={() =>
                                    setCreatingProject(
                                        true,
                                    )
                                }
                            />
                        ) : (
                            <CreateInline
                                value={
                                    newProjectName
                                }
                                placeholder="Project name"
                                actionLabel="Create & Add"
                                onChange={
                                    setNewProjectName
                                }
                                onSubmit={
                                    handleCreateProject
                                }
                                onCancel={() => {
                                    setCreatingProject(
                                        false,
                                    );

                                    setNewProjectName(
                                        "",
                                    );
                                }}
                            />
                        )}
                    </div>
                )}

                {onRemoveFromCollection && (
                    <>
                        <Divider />

                        <MenuButton
                            icon={
                                <FiLayers />
                            }
                            label="Remove from Collection"
                            danger
                            onClick={() =>
                                void handleRemoveFromCollection()
                            }
                        />
                    </>
                )}

                {onRemoveFromProject && (
                    <>
                        <Divider />

                        <MenuButton
                            icon={
                                <FiFolder />
                            }
                            label="Remove from Project"
                            danger
                            onClick={() =>
                                void handleRemoveFromProject()
                            }
                        />
                    </>
                )}

                <Divider />

                <MenuButton
                    icon={
                        <FiTrash2 />
                    }
                    label="Delete from Library"
                    danger
                    onClick={
                        handleDelete
                    }
                />
            </div>
        </div>
    );
}

interface MenuButtonProps {
    icon: React.ReactNode;
    label: string;
    disabled?: boolean;
    danger?: boolean;
    onClick: () => void;
}

function MenuButton({
    icon,
    label,
    disabled = false,
    danger = false,
    onClick,
}: MenuButtonProps) {
    return (
        <button
            type="button"
            disabled={
                disabled
            }
            onClick={
                onClick
            }
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs transition ${danger
                    ? "text-red-400 hover:bg-red-950/30 hover:text-red-300"
                    : "text-zinc-300 hover:bg-white/[0.06] hover:text-white"
                } disabled:cursor-not-allowed disabled:opacity-35`}
        >
            <span className="text-sm">
                {
                    icon
                }
            </span>

            <span className="truncate">
                {
                    label
                }
            </span>
        </button>
    );
}

interface PickerButtonProps {
    label: string;
    loading: boolean;
    onClick: () => void;
}

function PickerButton({
    label,
    loading,
    onClick,
}: PickerButtonProps) {
    return (
        <button
            type="button"
            disabled={
                loading
            }
            onClick={
                onClick
            }
            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs text-zinc-300 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-wait disabled:opacity-50"
        >
            <span className="flex min-w-0 items-center gap-2">
                <FiFolder className="shrink-0 text-zinc-500" />

                <span className="truncate">
                    {
                        label
                    }
                </span>
            </span>

            {loading && (
                <FiCheck className="shrink-0 text-red-400" />
            )}
        </button>
    );
}

interface CreateInlineProps {
    value: string;
    placeholder: string;
    actionLabel: string;
    onChange: (
        value: string,
    ) => void;
    onSubmit: () => Promise<void>;
    onCancel: () => void;
}

function CreateInline({
    value,
    placeholder,
    actionLabel,
    onChange,
    onSubmit,
    onCancel,
}: CreateInlineProps) {
    return (
        <div className="p-2">
            <input
                autoFocus
                value={
                    value
                }
                onChange={(
                    event,
                ) =>
                    onChange(
                        event.target.value,
                    )
                }
                onKeyDown={(
                    event,
                ) => {
                    if (
                        event.key ===
                        "Enter"
                    ) {
                        void onSubmit();
                    }

                    if (
                        event.key ===
                        "Escape"
                    ) {
                        onCancel();
                    }
                }}
                placeholder={
                    placeholder
                }
                className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-red-600/60"
            />

            <div className="mt-2 flex gap-2">
                <button
                    type="button"
                    onClick={() =>
                        void onSubmit()
                    }
                    className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-red-500"
                >
                    {
                        actionLabel
                    }
                </button>

                <button
                    type="button"
                    onClick={
                        onCancel
                    }
                    className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-400 transition hover:bg-white/5 hover:text-white"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}

function Divider() {
    return (
        <div className="my-1 border-t border-white/10" />
    );
}

function SectionLabel({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="px-3 pb-1 pt-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
            {
                children
            }
        </div>
    );
}

function EmptyPickerLabel({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="px-3 py-3 text-xs text-zinc-600">
            {
                children
            }
        </div>
    );
}
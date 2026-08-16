import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./App.css";

import { AppShell } from "./components/layout/AppShell";

import { CollectionsPage } from "./features/collections/components/CollectionsPage";
import { ProjectsPage } from "./features/projects/components/ProjectsPage";

import { EmptyLibraryState } from "./features/library/components/EmptyLibraryState";
import { InspectorPanel } from "./features/library/components/InspectorPanel";
import { LibraryPage } from "./features/library/components/LibraryPage";

import type { Asset } from "./features/library/types/asset";

import type {
  AssetTechnologyFilter,
} from "./features/library/components/LibraryToolbar";

import { selectAssetsForImport } from "./services/importService";

import {
  addAssetToCollection,
  addAssetToProject,
  assetExistsByPath,
  createCollection,
  createProject,
  deleteAssetById,
  deleteCollection,
  deleteProject,
  loadAssets,
  loadAssetsForCollection,
  loadAssetsForProject,
  loadCollections,
  loadProjects,
  removeAssetFromCollection,
  removeAssetFromProject,
  renameCollection,
  renameProject,
  saveAssets,
  updateAssetFavorite,
  updateAssetLastOpenedAt,
  updateProjectStatus,
  updateProjectDescription,
  createMachine,
  deleteMachine,
  loadMachines,
  updateMachine,
  createMaterial,
  deleteMaterial,
  loadMaterials,
  updateMaterial,
  type Collection,
  type Project,
  type ProjectStatus,
  type Machine,
  type MachineType,
  type MaterialSystem,
  type ConnectionType,
  type Material,
  type MaterialCategory,
  type MaterialDryingStatus,
} from "./services/databaseService";

import { MachinesPage } from "./features/machines/components/MachinesPage";
import { getMachineStatusClasses } from "./features/machines/utils/machineStatus";
import { MaterialsPage } from "./features/materials/components/MaterialsPage";
import {
  getMaterialInventoryStatus,
  getMaterialInventoryStatusClasses,
  getMaterialProgressBarClasses,
  getMaterialRemainingPercentage,
} from "./features/materials/utils/materialInventory";

function App() {
  /*
   * ---------------------------------------------------------
   * APP STATE
   * ---------------------------------------------------------
   */

  const [
    activeSection,
    setActiveSection,
  ] = useState("Library");

  const [
    technologyFilter,
    setTechnologyFilter,
  ] = useState<AssetTechnologyFilter>(
    "All Assets",
  );

  const [
    viewMode,
    setViewMode,
  ] = useState<"grid" | "list">(
    "grid",
  );

  const [
    search,
    setSearch,
  ] = useState("");

  /*
   * ---------------------------------------------------------
   * LIBRARY STATE
   * ---------------------------------------------------------
   */

  const [
    assets,
    setAssets,
  ] = useState<Asset[]>([]);

  const [
    selectedAsset,
    setSelectedAsset,
  ] = useState<Asset | null>(
    null,
  );

  /*
   * ---------------------------------------------------------
   * COLLECTION STATE
   * ---------------------------------------------------------
   */

  const [
    collections,
    setCollections,
  ] = useState<Collection[]>([]);

  const [
    selectedCollection,
    setSelectedCollection,
  ] = useState<Collection | null>(
    null,
  );

  const [
    collectionAssets,
    setCollectionAssets,
  ] = useState<Asset[]>([]);

  /*
   * ---------------------------------------------------------
   * PROJECT STATE
   * ---------------------------------------------------------
   */

  const [
    projects,
    setProjects,
  ] = useState<Project[]>([]);

  const [
    selectedProject,
    setSelectedProject,
  ] = useState<Project | null>(
    null,
  );

  const [
    projectAssets,
    setProjectAssets,
  ] = useState<Asset[]>([]);

  const [
    editingProjectDescription,
    setEditingProjectDescription,
  ] = useState(false);

  const [
    projectDescriptionDraft,
    setProjectDescriptionDraft,
  ] = useState("");

  const [
    editingProjectName,
    setEditingProjectName,
  ] = useState(false);

  const [
    projectNameDraft,
    setProjectNameDraft,
  ] = useState("");

  const [
    machines,
    setMachines,
  ] = useState<Machine[]>([]);

  const [
    selectedMachine,
    setSelectedMachine,
  ] = useState<Machine | null>(
    null,
  );

  const [
    editingMachine,
    setEditingMachine,
  ] = useState(false);

  const [
    machineDraft,
    setMachineDraft,
  ] = useState<Machine | null>(
    null,
  );

  const [
    savingMachine,
    setSavingMachine,
  ] = useState(false);

  const [
    materials,
    setMaterials,
  ] = useState<Material[]>([]);

  const [
    selectedMaterial,
    setSelectedMaterial,
  ] = useState<Material | null>(
    null,
  );

  const [
    editingMaterial,
    setEditingMaterial,
  ] = useState(false);

  const [
    materialDraft,
    setMaterialDraft,
  ] = useState<Material | null>(
    null,
  );

  const [
    savingMaterial,
    setSavingMaterial,
  ] = useState(false);

  /*
   * ---------------------------------------------------------
   * FILTER ASSETS
   * ---------------------------------------------------------
   */

  const filteredAssets =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      let sectionAssets =
        assets;

      /*
       * Collection detail uses only assets
       * belonging to the selected collection.
       */

      if (
        activeSection ===
        "Collection Detail"
      ) {
        sectionAssets =
          collectionAssets;
      }

      /*
       * Project detail uses only assets
       * belonging to the selected project.
       */

      if (
        activeSection ===
        "Project Detail"
      ) {
        sectionAssets =
          projectAssets;
      }

      /*
       * FAVORITES
       */

      if (
        activeSection ===
        "Favorites"
      ) {
        sectionAssets =
          sectionAssets.filter(
            (asset) =>
              asset.favorite ===
              true,
          );
      }

      /*
       * RECENT
       */

      if (
        activeSection ===
        "Recent"
      ) {
        sectionAssets =
          sectionAssets
            .filter(
              (asset) =>
                Boolean(
                  asset.lastOpenedAt,
                ),
            )
            .sort(
              (a, b) => {
                const aTime =
                  a.lastOpenedAt
                    ? new Date(
                      a.lastOpenedAt,
                    ).getTime()
                    : 0;

                const bTime =
                  b.lastOpenedAt
                    ? new Date(
                      b.lastOpenedAt,
                    ).getTime()
                    : 0;

                return (
                  bTime -
                  aTime
                );
              },
            );
      }

      /*
       * TECHNOLOGY FILTER
       */

      if (
        technologyFilter !==
        "All Assets"
      ) {
        sectionAssets =
          sectionAssets.filter(
            (asset) =>
              asset.technology ===
              technologyFilter,
          );
      }

      /*
       * SEARCH FILTER
       */

      if (!query) {
        return sectionAssets;
      }

      return sectionAssets.filter(
        (asset) => {
          return (
            asset.name
              .toLowerCase()
              .includes(query) ||
            asset.extension
              .toLowerCase()
              .includes(query) ||
            asset.technology
              .toLowerCase()
              .includes(query)
          );
        },
      );
    }, [
      assets,
      collectionAssets,
      projectAssets,
      search,
      activeSection,
      technologyFilter,
    ]);

  /*
   * ---------------------------------------------------------
   * INITIALIZE DATABASE DATA
   * ---------------------------------------------------------
   */

  useEffect(() => {
    async function initializeApp() {
      try {
        const [
          savedAssets,
          savedCollections,
          savedProjects,
          savedMachines,
          savedMaterials,
        ] =
          await Promise.all([
            loadAssets(),
            loadCollections(),
            loadProjects(),
            loadMachines(),
            loadMaterials(),
          ]);

        setAssets(
          savedAssets,
        );

        setCollections(
          savedCollections,
        );

        setProjects(
          savedProjects,
        );

        setMachines(
          savedMachines,
        );

        setMaterials(
          savedMaterials,
        );

        if (
          savedAssets.length >
          0
        ) {
          setSelectedAsset(
            savedAssets[0],
          );
        } else {
          setSelectedAsset(
            null,
          );
        }
      } catch (error) {
        console.error(
          "Failed to initialize database:",
          error,
        );

        setAssets([]);
        setCollections([]);
        setProjects([]);
        setMachines([]);
        setMaterials([]);

        setSelectedAsset(
          null,
        );
      }
    }

    void initializeApp();
  }, []);

  /*
   * ---------------------------------------------------------
   * IMPORT
   * ---------------------------------------------------------
   */

  async function handleImport() {
    try {
      const importedAssets =
        await selectAssetsForImport();

      if (
        importedAssets.length ===
        0
      ) {
        return;
      }

      const uniqueAssets:
        Asset[] = [];

      for (
        const asset
        of importedAssets
      ) {
        if (!asset.path) {
          continue;
        }

        const exists =
          await assetExistsByPath(
            asset.path,
          );

        if (!exists) {
          uniqueAssets.push(
            asset,
          );
        }
      }

      if (
        uniqueAssets.length ===
        0
      ) {
        alert(
          "Those files are already in your 3D PrintVault library.",
        );

        return;
      }

      await saveAssets(
        uniqueAssets,
      );

      setAssets(
        (
          currentAssets,
        ) => [
            ...uniqueAssets,
            ...currentAssets,
          ],
      );

      setSelectedAsset(
        uniqueAssets[0],
      );

      setActiveSection(
        "Library",
      );

      setTechnologyFilter(
        "All Assets",
      );
    } catch (error) {
      console.error(
        "Failed to import assets:",
        error,
      );

      alert(
        `Import failed: ${String(error)}`,
      );
    }
  }

  /*
   * ---------------------------------------------------------
   * ASSET SELECT / RECENT TRACKING
   * ---------------------------------------------------------
   */

  async function handleAssetSelect(
    asset: Asset,
  ) {
    const now =
      new Date().toISOString();

    const updatedAsset: Asset = {
      ...asset,
      lastOpenedAt: now,
    };

    setSelectedAsset(
      updatedAsset,
    );

    setAssets(
      (
        currentAssets,
      ) =>
        currentAssets.map(
          (item) =>
            item.id ===
              asset.id
              ? {
                ...item,
                lastOpenedAt:
                  now,
              }
              : item,
        ),
    );

    setCollectionAssets(
      (
        currentAssets,
      ) =>
        currentAssets.map(
          (item) =>
            item.id ===
              asset.id
              ? {
                ...item,
                lastOpenedAt:
                  now,
              }
              : item,
        ),
    );

    setProjectAssets(
      (
        currentAssets,
      ) =>
        currentAssets.map(
          (item) =>
            item.id ===
              asset.id
              ? {
                ...item,
                lastOpenedAt:
                  now,
              }
              : item,
        ),
    );

    try {
      await updateAssetLastOpenedAt(
        asset.id,
        now,
      );
    } catch (error) {
      console.error(
        "Failed to update recent timestamp:",
        error,
      );
    }
  }

  /*
   * ---------------------------------------------------------
   * KEEP SELECTED ASSET VALID
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (
      filteredAssets.length ===
      0
    ) {
      return;
    }

    const selectedStillVisible =
      selectedAsset &&
      filteredAssets.some(
        (asset) =>
          asset.id ===
          selectedAsset.id,
      );

    if (
      !selectedStillVisible
    ) {
      setSelectedAsset(
        filteredAssets[0],
      );
    }
  }, [
    filteredAssets,
    selectedAsset,
  ]);

  /*
   * ---------------------------------------------------------
   * DELETE ASSET
   * ---------------------------------------------------------
   */

  async function handleDeleteAsset(
    asset: Asset,
  ) {
    const confirmed =
      window.confirm(
        `Remove "${asset.name}" from 3D PrintVault?\n\nThis will not delete the original file from your Mac.`,
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteAssetById(
        asset.id,
      );

      setAssets(
        (
          currentAssets,
        ) =>
          currentAssets.filter(
            (item) =>
              item.id !==
              asset.id,
          ),
      );

      setCollectionAssets(
        (
          currentAssets,
        ) =>
          currentAssets.filter(
            (item) =>
              item.id !==
              asset.id,
          ),
      );

      setProjectAssets(
        (
          currentAssets,
        ) =>
          currentAssets.filter(
            (item) =>
              item.id !==
              asset.id,
          ),
      );

      if (
        selectedAsset?.id ===
        asset.id
      ) {
        setSelectedAsset(
          null,
        );
      }

      /*
       * Refresh counts because deleting an
       * asset may remove collection/project
       * memberships through foreign keys.
       */

      const [
        refreshedCollections,
        refreshedProjects,
      ] =
        await Promise.all([
          loadCollections(),
          loadProjects(),
        ]);

      setCollections(
        refreshedCollections,
      );

      setProjects(
        refreshedProjects,
      );
    } catch (error) {
      console.error(
        "Failed to delete asset:",
        error,
      );

      alert(
        `Delete failed: ${String(error)}`,
      );
    }
  }

  /*
   * ---------------------------------------------------------
   * FAVORITES
   * ---------------------------------------------------------
   */

  async function handleUpdateFavorite(
    asset: Asset,
    favorite: boolean,
  ) {
    try {
      await updateAssetFavorite(
        asset.id,
        favorite,
      );

      setAssets(
        (
          currentAssets,
        ) =>
          currentAssets.map(
            (item) =>
              item.id ===
                asset.id
                ? {
                  ...item,
                  favorite,
                }
                : item,
          ),
      );

      setCollectionAssets(
        (
          currentAssets,
        ) =>
          currentAssets.map(
            (item) =>
              item.id ===
                asset.id
                ? {
                  ...item,
                  favorite,
                }
                : item,
          ),
      );

      setProjectAssets(
        (
          currentAssets,
        ) =>
          currentAssets.map(
            (item) =>
              item.id ===
                asset.id
                ? {
                  ...item,
                  favorite,
                }
                : item,
          ),
      );

      setSelectedAsset(
        (
          currentAsset,
        ) => {
          if (
            !currentAsset ||
            currentAsset.id !==
            asset.id
          ) {
            return currentAsset;
          }

          return {
            ...currentAsset,
            favorite,
          };
        },
      );
    } catch (error) {
      console.error(
        "Failed to update favorite:",
        error,
      );

      alert(
        `Unable to update favorite: ${String(error)}`,
      );
    }
  }

  /*
   * ---------------------------------------------------------
   * COLLECTIONS
   * ---------------------------------------------------------
   */

  async function handleCreateCollection(
    name: string,
  ): Promise<Collection | null> {
    try {
      const collection =
        await createCollection(
          name,
        );

      const refreshedCollections =
        await loadCollections();

      setCollections(
        refreshedCollections,
      );

      return collection;
    } catch (error) {
      console.error(
        "Failed to create collection:",
        error,
      );

      alert(
        `Unable to create collection: ${String(error)}`,
      );

      return null;
    }
  }

  async function handleRenameCollection(
    collection: Collection,
    name: string,
  ): Promise<void> {
    try {
      await renameCollection(
        collection.id,
        name,
      );

      const refreshedCollections =
        await loadCollections();

      setCollections(
        refreshedCollections,
      );

      if (
        selectedCollection?.id ===
        collection.id
      ) {
        const renamedCollection =
          refreshedCollections.find(
            (item) =>
              item.id ===
              collection.id,
          );

        if (
          renamedCollection
        ) {
          setSelectedCollection(
            renamedCollection,
          );
        }
      }
    } catch (error) {
      console.error(
        "Failed to rename collection:",
        error,
      );

      alert(
        `Unable to rename "${collection.name}": ${String(error)}`,
      );

      throw error;
    }
  }

  async function handleDeleteCollection(
    collection: Collection,
  ) {
    const confirmed =
      window.confirm(
        `Delete collection "${collection.name}"?\n\nThe assets inside it will remain in your library.`,
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteCollection(
        collection.id,
      );

      const refreshedCollections =
        await loadCollections();

      setCollections(
        refreshedCollections,
      );

      if (
        selectedCollection?.id ===
        collection.id
      ) {
        setSelectedCollection(
          null,
        );

        setCollectionAssets(
          [],
        );

        setActiveSection(
          "Collections",
        );
      }
    } catch (error) {
      console.error(
        "Failed to delete collection:",
        error,
      );

      alert(
        `Unable to delete collection: ${String(error)}`,
      );
    }
  }

  async function handleOpenCollection(
    collection: Collection,
  ) {
    try {
      const assetsInCollection =
        await loadAssetsForCollection(
          collection.id,
        );

      setSelectedCollection(
        collection,
      );

      setCollectionAssets(
        assetsInCollection,
      );

      setSelectedProject(
        null,
      );

      setProjectAssets(
        [],
      );

      setTechnologyFilter(
        "All Assets",
      );

      if (
        assetsInCollection.length >
        0
      ) {
        setSelectedAsset(
          assetsInCollection[0],
        );
      } else {
        setSelectedAsset(
          null,
        );
      }

      setActiveSection(
        "Collection Detail",
      );
    } catch (error) {
      console.error(
        "Failed to open collection:",
        error,
      );

      alert(
        `Unable to open collection: ${String(error)}`,
      );
    }
  }

  async function handleAddToCollection(
    asset: Asset,
    collection: Collection,
  ): Promise<void> {
    try {
      await addAssetToCollection(
        asset.id,
        collection.id,
      );

      const refreshedCollections =
        await loadCollections();

      setCollections(
        refreshedCollections,
      );

      if (
        selectedCollection?.id ===
        collection.id
      ) {
        const refreshedAssets =
          await loadAssetsForCollection(
            collection.id,
          );

        setCollectionAssets(
          refreshedAssets,
        );
      }
    } catch (error) {
      console.error(
        "Failed to add asset to collection:",
        error,
      );

      alert(
        `Unable to add "${asset.name}" to "${collection.name}": ${String(error)}`,
      );

      throw error;
    }
  }

  async function handleRemoveFromCollection(
    asset: Asset,
  ): Promise<void> {
    if (
      !selectedCollection
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Remove "${asset.name}" from "${selectedCollection.name}"?\n\nThe asset will remain in your main Library.`,
      );

    if (!confirmed) {
      return;
    }

    try {
      await removeAssetFromCollection(
        asset.id,
        selectedCollection.id,
      );

      const refreshedAssets =
        await loadAssetsForCollection(
          selectedCollection.id,
        );

      setCollectionAssets(
        refreshedAssets,
      );

      const refreshedCollections =
        await loadCollections();

      setCollections(
        refreshedCollections,
      );

      if (
        selectedAsset?.id ===
        asset.id
      ) {
        setSelectedAsset(
          refreshedAssets[0] ??
          null,
        );
      }
    } catch (error) {
      console.error(
        "Failed to remove asset from collection:",
        error,
      );

      alert(
        `Unable to remove "${asset.name}" from "${selectedCollection.name}": ${String(error)}`,
      );
    }
  }

  /*
   * ---------------------------------------------------------
   * PROJECTS
   * ---------------------------------------------------------
   */

  async function handleCreateProject(
    name: string,
    description: string,
  ): Promise<Project | null> {
    try {
      const project =
        await createProject(
          name,
          description,
        );

      const refreshedProjects =
        await loadProjects();

      setProjects(
        refreshedProjects,
      );

      return project;
    } catch (error) {
      console.error(
        "Failed to create project:",
        error,
      );

      alert(
        `Unable to create project: ${String(error)}`,
      );

      return null;
    }
  }

  async function handleRenameProject(
    project: Project,
    name: string,
  ): Promise<void> {
    try {
      await renameProject(
        project.id,
        name,
      );

      const refreshedProjects =
        await loadProjects();

      setProjects(
        refreshedProjects,
      );

      if (
        selectedProject?.id ===
        project.id
      ) {
        const renamedProject =
          refreshedProjects.find(
            (item) =>
              item.id ===
              project.id,
          );

        if (
          renamedProject
        ) {
          setSelectedProject(
            renamedProject,
          );
        }
      }
    } catch (error) {
      console.error(
        "Failed to rename project:",
        error,
      );

      alert(
        `Unable to rename "${project.name}": ${String(error)}`,
      );

      throw error;
    }
  }

  async function handleUpdateProjectStatus(
    project: Project,
    status: ProjectStatus,
  ): Promise<void> {
    try {
      await updateProjectStatus(
        project.id,
        status,
      );

      const refreshedProjects =
        await loadProjects();

      setProjects(
        refreshedProjects,
      );

      const updatedProject =
        refreshedProjects.find(
          (item) =>
            item.id ===
            project.id,
        );

      if (
        updatedProject
      ) {
        setSelectedProject(
          updatedProject,
        );
      }
    } catch (error) {
      console.error(
        "Failed to update project status:",
        error,
      );

      alert(
        `Unable to update project status: ${String(error)}`,
      );

      throw error;
    }
  }

  async function handleUpdateProjectDescription(
    project: Project,
    description: string,
  ): Promise<void> {
    try {
      await updateProjectDescription(
        project.id,
        description,
      );

      const refreshedProjects =
        await loadProjects();

      setProjects(
        refreshedProjects,
      );

      const updatedProject =
        refreshedProjects.find(
          (item) =>
            item.id ===
            project.id,
        );

      if (updatedProject) {
        setSelectedProject(
          updatedProject,
        );
      }
    } catch (error) {
      console.error(
        "Failed to update project description:",
        error,
      );

      alert(
        `Unable to update project description: ${String(error)}`,
      );

      throw error;
    }
  }

  function beginEditProjectDescription() {
    if (!selectedProject) {
      return;
    }

    setProjectDescriptionDraft(
      selectedProject.description ?? "",
    );

    setEditingProjectDescription(true);
  }

  function cancelEditProjectDescription() {
    setEditingProjectDescription(false);
    setProjectDescriptionDraft("");
  }

  async function saveProjectDescription() {
    if (!selectedProject) {
      return;
    }

    await handleUpdateProjectDescription(
      selectedProject,
      projectDescriptionDraft,
    );

    setEditingProjectDescription(false);
    setProjectDescriptionDraft("");
  }

  function beginEditProjectName() {
    if (!selectedProject) {
      return;
    }

    setProjectNameDraft(
      selectedProject.name,
    );

    setEditingProjectName(
      true,
    );
  }

  function cancelEditProjectName() {
    setEditingProjectName(
      false,
    );

    setProjectNameDraft(
      "",
    );
  }

  async function saveProjectName() {
    if (!selectedProject) {
      return;
    }

    const trimmedName =
      projectNameDraft.trim();

    if (!trimmedName) {
      return;
    }

    await handleRenameProject(
      selectedProject,
      trimmedName,
    );

    setEditingProjectName(
      false,
    );

    setProjectNameDraft(
      "",
    );
  }

  async function handleDeleteProject(
    project: Project,
  ): Promise<void> {
    const confirmed =
      window.confirm(
        `Delete project "${project.name}"?\n\nThe assets assigned to this project will remain in your Library.`,
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteProject(
        project.id,
      );

      const refreshedProjects =
        await loadProjects();

      setProjects(
        refreshedProjects,
      );

      if (
        selectedProject?.id ===
        project.id
      ) {
        setSelectedProject(
          null,
        );

        setProjectAssets(
          [],
        );

        setActiveSection(
          "Projects",
        );
      }
    } catch (error) {
      console.error(
        "Failed to delete project:",
        error,
      );

      alert(
        `Unable to delete project: ${String(error)}`,
      );
    }
  }

  async function handleOpenProject(
    project: Project,
  ) {
    try {
      const assetsInProject =
        await loadAssetsForProject(
          project.id,
        );

      setSelectedProject(
        project,
      );

      setProjectAssets(
        assetsInProject,
      );

      /*
       * Clear collection-detail state.
       */

      setSelectedCollection(
        null,
      );

      setCollectionAssets(
        [],
      );

      setTechnologyFilter(
        "All Assets",
      );

      if (
        assetsInProject.length >
        0
      ) {
        setSelectedAsset(
          assetsInProject[0],
        );
      } else {
        setSelectedAsset(
          null,
        );
      }

      setActiveSection(
        "Project Detail",
      );
    } catch (error) {
      console.error(
        "Failed to open project:",
        error,
      );

      alert(
        `Unable to open project: ${String(error)}`,
      );
    }
  }

  async function handleAddToProject(
    asset: Asset,
    project: Project,
  ): Promise<void> {
    try {
      await addAssetToProject(
        asset.id,
        project.id,
      );

      const refreshedProjects =
        await loadProjects();

      setProjects(
        refreshedProjects,
      );

      if (
        selectedProject?.id ===
        project.id
      ) {
        const refreshedAssets =
          await loadAssetsForProject(
            project.id,
          );

        setProjectAssets(
          refreshedAssets,
        );
      }
    } catch (error) {
      console.error(
        "Failed to add asset to project:",
        error,
      );

      alert(
        `Unable to add "${asset.name}" to "${project.name}": ${String(error)}`,
      );

      throw error;
    }
  }

  async function handleRemoveFromProject(
    asset: Asset,
  ): Promise<void> {
    if (!selectedProject) {
      return;
    }

    const confirmed =
      window.confirm(
        `Remove "${asset.name}" from "${selectedProject.name}"?\n\nThe asset will remain in your main Library.`,
      );

    if (!confirmed) {
      return;
    }

    try {
      await removeAssetFromProject(
        asset.id,
        selectedProject.id,
      );

      const refreshedAssets =
        await loadAssetsForProject(
          selectedProject.id,
        );

      setProjectAssets(
        refreshedAssets,
      );

      const refreshedProjects =
        await loadProjects();

      setProjects(
        refreshedProjects,
      );

      if (
        selectedAsset?.id ===
        asset.id
      ) {
        setSelectedAsset(
          refreshedAssets[0] ??
          null,
        );
      }
    } catch (error) {
      console.error(
        "Failed to remove asset from project:",
        error,
      );

      alert(
        `Unable to remove "${asset.name}" from "${selectedProject.name}": ${String(error)}`,
      );

      throw error;
    }
  }

  async function handleCreateMachine(
    name: string,
    manufacturer: string,
    model: string,
    type: MachineType,
  ): Promise<Machine | null> {
    try {
      const machine =
        await createMachine(
          name,
          manufacturer,
          model,
          type,
        );

      const refreshedMachines =
        await loadMachines();

      setMachines(
        refreshedMachines,
      );

      return machine;
    } catch (error) {
      console.error(
        "Failed to create machine:",
        error,
      );

      alert(
        `Unable to create machine: ${String(error)}`,
      );

      return null;
    }
  }

  async function handleDeleteMachine(
    machine: Machine,
  ): Promise<void> {
    const confirmed =
      window.confirm(
        `Delete machine "${machine.name}"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteMachine(
        machine.id,
      );

      const refreshedMachines =
        await loadMachines();

      setMachines(
        refreshedMachines,
      );
    } catch (error) {
      console.error(
        "Failed to delete machine:",
        error,
      );

      alert(
        `Unable to delete machine: ${String(error)}`,
      );
    }
  }

  function handleOpenMachine(
    machine: Machine,
  ) {
    setSelectedMachine(
      machine,
    );

    setActiveSection(
      "Machine Detail",
    );
  }

  async function handleUpdateMachine(
    machine: Machine,
  ): Promise<void> {
    try {
      await updateMachine(
        machine,
      );

      const refreshedMachines =
        await loadMachines();

      setMachines(
        refreshedMachines,
      );

      const updatedMachine =
        refreshedMachines.find(
          (item) =>
            item.id ===
            machine.id,
        );

      if (updatedMachine) {
        setSelectedMachine(
          updatedMachine,
        );
      }
    } catch (error) {
      console.error(
        "Failed to update machine:",
        error,
      );

      alert(
        `Unable to update machine: ${String(error)}`,
      );

      throw error;
    }
  }

  function handleOpenMaterial(
    material: Material,
  ) {
    setSelectedMaterial(
      material,
    );

    setActiveSection(
      "Material Detail",
    );
  }

  function beginEditMachine() {
    if (!selectedMachine) {
      return;
    }

    setMachineDraft({
      ...selectedMachine,
    });

    setEditingMachine(true);
  }

  function cancelEditMachine() {
    setEditingMachine(false);
    setMachineDraft(null);
  }

  function updateMachineDraft<K extends keyof Machine>(
    field: K,
    value: Machine[K],
  ) {
    setMachineDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [field]: value,
      };
    });
  }

  async function saveMachineChanges() {
    if (!machineDraft) {
      return;
    }

    if (
      !machineDraft.name.trim() ||
      !machineDraft.manufacturer.trim() ||
      !machineDraft.model.trim()
    ) {
      alert(
        "Machine name, manufacturer, and model are required.",
      );

      return;
    }

    try {
      setSavingMachine(true);

      await handleUpdateMachine({
        ...machineDraft,
        name: machineDraft.name.trim(),
        manufacturer:
          machineDraft.manufacturer.trim(),
        model: machineDraft.model.trim(),
        serialNumber:
          machineDraft.serialNumber?.trim() ||
          undefined,
        ipAddress:
          machineDraft.ipAddress?.trim() ||
          undefined,
        notes:
          machineDraft.notes?.trim() ||
          undefined,
      });

      setEditingMachine(false);
      setMachineDraft(null);
    } finally {
      setSavingMachine(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * SIDEBAR SECTION CHANGE
   * ---------------------------------------------------------
   */

  function handleSectionChange(
    section: string,
  ) {
    setActiveSection(
      section,
    );

    /*
     * Leave collection-detail state
     * when navigating somewhere else.
     */

    if (
      section !==
      "Collection Detail"
    ) {
      setSelectedCollection(
        null,
      );

      setCollectionAssets(
        [],
      );
    }

    /*
     * Leave machine-detail state
     * when navigating somewhere else.
     */

    if (
      section !==
      "Machine Detail"
    ) {
      setSelectedMachine(
        null,
      );

      setEditingMachine(
        false,
      );

      setMachineDraft(
        null,
      );
    }

    /*
     * Leave project-detail state
     * when navigating somewhere else.
     */

    if (
      section !==
      "Project Detail"
    ) {
      setSelectedProject(
        null,
      );

      setProjectAssets(
        [],
      );
    }

    /*
     * Leave material-detail state
     * when navigating somewhere else.
     */

    if (
      section !==
      "Material Detail"
    ) {
      setSelectedMaterial(
        null,
      );

      setEditingMaterial(
        false,
      );

      setMaterialDraft(
        null,
      );
    }

    if (
      section ===
      "Library" ||
      section ===
      "Recent" ||
      section ===
      "Favorites" ||
      section ===
      "Projects" ||
      section ===
      "Collections" ||
      section ===
      "Machines" ||
      section ===
      "Materials"
    ) {
      setTechnologyFilter(
        "All Assets",
      );
    }
  }

  async function handleCreateMaterial(
    name: string,
    brand: string,
    category: MaterialCategory,
    materialType: string,
  ): Promise<Material | null> {
    try {
      const material =
        await createMaterial(
          name,
          brand,
          category,
          materialType,
        );

      const refreshedMaterials =
        await loadMaterials();

      setMaterials(
        refreshedMaterials,
      );

      return material;
    } catch (error) {
      console.error(
        "Failed to create material:",
        error,
      );

      alert(
        `Unable to create material: ${String(error)}`,
      );

      return null;
    }
  }

  async function handleDeleteMaterial(
    material: Material,
  ): Promise<void> {
    const confirmed =
      window.confirm(
        `Delete material "${material.name}"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteMaterial(
        material.id,
      );

      const refreshedMaterials =
        await loadMaterials();

      setMaterials(
        refreshedMaterials,
      );
    } catch (error) {
      console.error(
        "Failed to delete material:",
        error,
      );

      alert(
        `Unable to delete material: ${String(error)}`,
      );
    }
  }

  async function handleUpdateMaterial(
    material: Material,
  ): Promise<void> {
    try {
      await updateMaterial(
        material,
      );

      const refreshedMaterials =
        await loadMaterials();

      setMaterials(
        refreshedMaterials,
      );

      const updatedMaterial =
        refreshedMaterials.find(
          (item) =>
            item.id ===
            material.id,
        );

      if (updatedMaterial) {
        setSelectedMaterial(
          updatedMaterial,
        );
      }
    } catch (error) {
      console.error(
        "Failed to update material:",
        error,
      );

      alert(
        `Unable to update material: ${String(error)}`,
      );

      throw error;
    }
  }

  function beginEditMaterial() {
    if (!selectedMaterial) {
      return;
    }

    setMaterialDraft({
      ...selectedMaterial,
    });

    setEditingMaterial(
      true,
    );
  }

  function cancelEditMaterial() {
    setEditingMaterial(
      false,
    );

    setMaterialDraft(
      null,
    );
  }

  function updateMaterialDraft<
    K extends keyof Material
  >(
    field: K,
    value: Material[K],
  ) {
    setMaterialDraft(
      (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          [field]: value,
        };
      },
    );
  }

  async function saveMaterialChanges() {
    if (!materialDraft) {
      return;
    }

    if (
      !materialDraft.name.trim() ||
      !materialDraft.brand.trim() ||
      !materialDraft.materialType.trim()
    ) {
      alert(
        "Material name, brand, and material type are required.",
      );

      return;
    }

    try {
      setSavingMaterial(
        true,
      );

      await handleUpdateMaterial({
        ...materialDraft,

        name:
          materialDraft.name.trim(),

        brand:
          materialDraft.brand.trim(),

        materialType:
          materialDraft.materialType.trim(),

        color:
          materialDraft.color?.trim() ||
          undefined,

        colorHex:
          materialDraft.colorHex?.trim() ||
          undefined,

        storageLocation:
          materialDraft.storageLocation?.trim() ||
          undefined,

        notes:
          materialDraft.notes?.trim() ||
          undefined,
      });

      setEditingMaterial(
        false,
      );

      setMaterialDraft(
        null,
      );
    } finally {
      setSavingMaterial(
        false,
      );
    }
  }

  /*
   * ---------------------------------------------------------
   * EMPTY STATE INFO
   * ---------------------------------------------------------
   */

  const libraryIsEmpty =
    assets.length === 0;

  const hasAnyFavorites =
    assets.some(
      (asset) =>
        asset.favorite === true,
    );

  const hasAnyRecentAssets =
    assets.some(
      (asset) =>
        Boolean(
          asset.lastOpenedAt,
        ),
    );

  const favoritesAreEmpty =
    activeSection ===
    "Favorites" &&
    !hasAnyFavorites;

  const recentIsEmpty =
    activeSection ===
    "Recent" &&
    !hasAnyRecentAssets;

  const collectionIsEmpty =
    activeSection ===
    "Collection Detail" &&
    filteredAssets.length ===
    0;

  const projectIsEmpty =
    activeSection ===
    "Project Detail" &&
    filteredAssets.length ===
    0;

  /*
   * ---------------------------------------------------------
   * MAIN CONTENT
   * ---------------------------------------------------------
   */

  function renderContent() {
    /*
     * ---------------------------------------------------------
     * PROJECT LIST
     * ---------------------------------------------------------
     */

    if (
      activeSection ===
      "Machine Detail" &&
      selectedMachine
    ) {
      return (
        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          {/* ------------------------------------------------------
       * MACHINE DETAIL HEADER
       * ------------------------------------------------------ */}

          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div className="flex items-center">
              <button
                type="button"
                onClick={() =>
                  handleSectionChange(
                    "Machines",
                  )
                }
                className="text-xs text-zinc-400 transition hover:text-white"
              >
                ← Machines
              </button>

              <div className="ml-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-zinc-100">
                    {
                      selectedMachine.name
                    }
                  </h2>

                  <select
                    value={
                      selectedMachine.status
                    }
                    onChange={(event) =>
                      void handleUpdateMachine({
                        ...selectedMachine,
                        status:
                          event.target.value as Machine["status"],
                      })
                    }
                    className={`rounded-md border px-2 py-1 text-[10px] outline-none transition ${getMachineStatusClasses(
                      selectedMachine.status,
                    )}`}
                  >
                    <option value="Ready">
                      Ready
                    </option>

                    <option value="Busy">
                      Busy
                    </option>

                    <option value="Maintenance">
                      Maintenance
                    </option>

                    <option value="Offline">
                      Offline
                    </option>
                  </select>
                </div>

                <p className="mt-1 text-xs text-zinc-500">
                  {
                    selectedMachine.manufacturer
                  }{" "}
                  {
                    selectedMachine.model
                  }
                  {" · "}
                  {
                    selectedMachine.type
                  }
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={
                beginEditMachine
              }
              className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-zinc-200 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-white"
            >
              Edit Machine
            </button>
          </div>

          {/* ------------------------------------------------------
       * MACHINE DETAIL CONTENT
       * ------------------------------------------------------ */}

          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            <div className="grid gap-4 xl:grid-cols-2">
              {/* --------------------------------------------------
           * MACHINE INFORMATION
           * -------------------------------------------------- */}

              <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
                <h3 className="text-sm font-semibold text-zinc-100">
                  Machine Information
                </h3>

                <div className="mt-4 space-y-3 text-sm">
                  <DetailRow
                    label="Machine Name"
                    value={
                      selectedMachine.name
                    }
                  />

                  <DetailRow
                    label="Manufacturer"
                    value={
                      selectedMachine.manufacturer
                    }
                  />

                  <DetailRow
                    label="Model"
                    value={
                      selectedMachine.model
                    }
                  />

                  <DetailRow
                    label="Machine Type"
                    value={
                      selectedMachine.type
                    }
                  />

                  <DetailRow
                    label="Status"
                    value={
                      selectedMachine.status
                    }
                  />
                </div>
              </div>

              {/* --------------------------------------------------
           * SPECIFICATIONS
           * -------------------------------------------------- */}

              <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
                <h3 className="text-sm font-semibold text-zinc-100">
                  Specifications
                </h3>

                <div className="mt-4 space-y-3 text-sm">
                  <DetailRow
                    label="Build Volume"
                    value={
                      selectedMachine.buildVolumeX &&
                        selectedMachine.buildVolumeY &&
                        selectedMachine.buildVolumeZ
                        ? `${selectedMachine.buildVolumeX} × ${selectedMachine.buildVolumeY} × ${selectedMachine.buildVolumeZ} mm`
                        : "Not set"
                    }
                  />

                  <DetailRow
                    label="Nozzle Size"
                    value={
                      selectedMachine.nozzleSize
                        ? `${selectedMachine.nozzleSize} mm`
                        : "Not set"
                    }
                  />

                  <DetailRow
                    label="Serial Number"
                    value={
                      selectedMachine.serialNumber ??
                      "Not set"
                    }
                  />

                  <DetailRow
                    label="IP Address"
                    value={
                      selectedMachine.ipAddress ??
                      "Not set"
                    }
                  />
                </div>
              </div>

              {/* --------------------------------------------------
           * CONFIGURATION
           * -------------------------------------------------- */}

              <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
                <h3 className="text-sm font-semibold text-zinc-100">
                  Configuration
                </h3>

                <div className="mt-4 space-y-3 text-sm">
                  <DetailRow
                    label="Build Plate"
                    value={
                      selectedMachine.buildPlate ??
                      "Not set"
                    }
                  />

                  <DetailRow
                    label="Material System"
                    value={
                      selectedMachine.materialSystem ??
                      "Not set"
                    }
                  />

                  <DetailRow
                    label="Connection Type"
                    value={
                      selectedMachine.connectionType ??
                      "Not set"
                    }
                  />

                  <DetailRow
                    label="Hostname"
                    value={
                      selectedMachine.hostname ??
                      "Not set"
                    }
                  />
                </div>
              </div>

              {/* --------------------------------------------------
           * CONNECTION
           * -------------------------------------------------- */}

              <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
                <h3 className="text-sm font-semibold text-zinc-100">
                  Connection
                </h3>

                <div className="mt-4 space-y-3 text-sm">
                  <DetailRow
                    label="Connection Type"
                    value={
                      selectedMachine.connectionType ??
                      "Not set"
                    }
                  />

                  <DetailRow
                    label="Hostname"
                    value={
                      selectedMachine.hostname ??
                      "Not set"
                    }
                  />

                  <DetailRow
                    label="IP Address"
                    value={
                      selectedMachine.ipAddress ??
                      "Not set"
                    }
                  />
                </div>
              </div>

              {/* --------------------------------------------------
           * NOTES
           * -------------------------------------------------- */}

              <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5 xl:col-span-2">
                <h3 className="text-sm font-semibold text-zinc-100">
                  Notes
                </h3>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-400">
                  {
                    selectedMachine.notes ??
                    "No notes added."
                  }
                </p>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------
       * EDIT MACHINE MODAL
       * ------------------------------------------------------ */}

          {editingMachine &&
            machineDraft && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
                <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-white/10 bg-zinc-950 shadow-2xl">
                  {/* ------------------------------------------------
               * MODAL HEADER
               * ------------------------------------------------ */}

                  <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-100">
                        Edit Machine
                      </h3>

                      <p className="mt-1 text-xs text-zinc-500">
                        Update machine information, specifications, and configuration.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={
                        cancelEditMachine
                      }
                      className="text-xl leading-none text-zinc-500 transition hover:text-white"
                      aria-label="Close edit machine"
                    >
                      ×
                    </button>
                  </div>

                  {/* ------------------------------------------------
               * MODAL CONTENT
               * ------------------------------------------------ */}

                  <div className="min-h-0 flex-1 overflow-y-auto p-5">
                    {/* ----------------------------------------------
                 * MACHINE INFORMATION
                 * ---------------------------------------------- */}

                    <div>
                      <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Machine Information
                      </h4>

                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-xs font-medium text-zinc-400">
                            Machine Name
                          </span>

                          <input
                            autoFocus
                            value={
                              machineDraft.name
                            }
                            onChange={(event) =>
                              updateMachineDraft(
                                "name",
                                event.target.value,
                              )
                            }
                            placeholder="Alpha Prime"
                            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-red-600/60"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-medium text-zinc-400">
                            Manufacturer
                          </span>

                          <input
                            value={
                              machineDraft.manufacturer
                            }
                            onChange={(event) =>
                              updateMachineDraft(
                                "manufacturer",
                                event.target.value,
                              )
                            }
                            placeholder="Bambu Lab"
                            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-red-600/60"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-medium text-zinc-400">
                            Model
                          </span>

                          <input
                            value={
                              machineDraft.model
                            }
                            onChange={(event) =>
                              updateMachineDraft(
                                "model",
                                event.target.value,
                              )
                            }
                            placeholder="X2D"
                            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-red-600/60"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-medium text-zinc-400">
                            Machine Type
                          </span>

                          <select
                            value={
                              machineDraft.type
                            }
                            onChange={(event) =>
                              updateMachineDraft(
                                "type",
                                event.target.value as MachineType,
                              )
                            }
                            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-red-600/60"
                          >
                            <option value="FDM / FFF">
                              FDM / FFF
                            </option>

                            <option value="Resin">
                              Resin
                            </option>

                            <option value="Laser">
                              Laser
                            </option>

                            <option value="CNC">
                              CNC
                            </option>

                            <option value="Other">
                              Other
                            </option>
                          </select>
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-medium text-zinc-400">
                            Status
                          </span>

                          <select
                            value={
                              machineDraft.status
                            }
                            onChange={(event) =>
                              updateMachineDraft(
                                "status",
                                event.target.value as Machine["status"],
                              )
                            }
                            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-red-600/60"
                          >
                            <option value="Ready">
                              Ready
                            </option>

                            <option value="Busy">
                              Busy
                            </option>

                            <option value="Maintenance">
                              Maintenance
                            </option>

                            <option value="Offline">
                              Offline
                            </option>
                          </select>
                        </label>
                      </div>
                    </div>

                    {/* ----------------------------------------------
                 * SPECIFICATIONS
                 * ---------------------------------------------- */}

                    <div className="mt-7 border-t border-white/10 pt-6">
                      <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Specifications
                      </h4>

                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-xs font-medium text-zinc-400">
                            Nozzle Size (mm)
                          </span>

                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={
                              machineDraft.nozzleSize ??
                              ""
                            }
                            onChange={(event) =>
                              updateMachineDraft(
                                "nozzleSize",
                                event.target.value === ""
                                  ? undefined
                                  : Number(
                                    event.target.value,
                                  ),
                              )
                            }
                            placeholder="0.4"
                            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-red-600/60"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-medium text-zinc-400">
                            Serial Number
                          </span>

                          <input
                            value={
                              machineDraft.serialNumber ??
                              ""
                            }
                            onChange={(event) =>
                              updateMachineDraft(
                                "serialNumber",
                                event.target.value,
                              )
                            }
                            placeholder="Serial number"
                            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-red-600/60"
                          />
                        </label>
                      </div>

                      <div className="mt-5">
                        <span className="mb-2 block text-xs font-medium text-zinc-400">
                          Build Volume (mm)
                        </span>

                        <div className="grid grid-cols-3 gap-3">
                          <label className="block">
                            <span className="mb-1 block text-[10px] text-zinc-500">
                              X
                            </span>

                            <input
                              type="number"
                              min="0"
                              value={
                                machineDraft.buildVolumeX ??
                                ""
                              }
                              onChange={(event) =>
                                updateMachineDraft(
                                  "buildVolumeX",
                                  event.target.value === ""
                                    ? undefined
                                    : Number(
                                      event.target.value,
                                    ),
                                )
                              }
                              placeholder="X"
                              className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-red-600/60"
                            />
                          </label>

                          <label className="block">
                            <span className="mb-1 block text-[10px] text-zinc-500">
                              Y
                            </span>

                            <input
                              type="number"
                              min="0"
                              value={
                                machineDraft.buildVolumeY ??
                                ""
                              }
                              onChange={(event) =>
                                updateMachineDraft(
                                  "buildVolumeY",
                                  event.target.value === ""
                                    ? undefined
                                    : Number(
                                      event.target.value,
                                    ),
                                )
                              }
                              placeholder="Y"
                              className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-red-600/60"
                            />
                          </label>

                          <label className="block">
                            <span className="mb-1 block text-[10px] text-zinc-500">
                              Z
                            </span>

                            <input
                              type="number"
                              min="0"
                              value={
                                machineDraft.buildVolumeZ ??
                                ""
                              }
                              onChange={(event) =>
                                updateMachineDraft(
                                  "buildVolumeZ",
                                  event.target.value === ""
                                    ? undefined
                                    : Number(
                                      event.target.value,
                                    ),
                                )
                              }
                              placeholder="Z"
                              className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-red-600/60"
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* ----------------------------------------------
                 * MACHINE CONFIGURATION
                 * ---------------------------------------------- */}

                    <div className="mt-7 border-t border-white/10 pt-6">
                      <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Machine Configuration
                      </h4>

                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-xs font-medium text-zinc-400">
                            Build Plate
                          </span>

                          <input
                            value={
                              machineDraft.buildPlate ??
                              ""
                            }
                            onChange={(event) =>
                              updateMachineDraft(
                                "buildPlate",
                                event.target.value,
                              )
                            }
                            placeholder="Textured PEI"
                            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-red-600/60"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-medium text-zinc-400">
                            Material System
                          </span>

                          <select
                            value={
                              machineDraft.materialSystem ??
                              "None"
                            }
                            onChange={(event) =>
                              updateMachineDraft(
                                "materialSystem",
                                event.target.value as MaterialSystem,
                              )
                            }
                            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-red-600/60"
                          >
                            <option value="None">
                              None
                            </option>

                            <option value="AMS">
                              AMS
                            </option>

                            <option value="AMS HT">
                              AMS HT
                            </option>

                            <option value="Other">
                              Other
                            </option>
                          </select>
                        </label>
                      </div>
                    </div>

                    {/* ----------------------------------------------
                 * CONNECTION
                 * ---------------------------------------------- */}

                    <div className="mt-7 border-t border-white/10 pt-6">
                      <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Connection
                      </h4>

                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-xs font-medium text-zinc-400">
                            Connection Type
                          </span>

                          <select
                            value={
                              machineDraft.connectionType ??
                              "Manual"
                            }
                            onChange={(event) =>
                              updateMachineDraft(
                                "connectionType",
                                event.target.value as ConnectionType,
                              )
                            }
                            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-red-600/60"
                          >
                            <option value="Local Network">
                              Local Network
                            </option>

                            <option value="Cloud">
                              Cloud
                            </option>

                            <option value="USB">
                              USB
                            </option>

                            <option value="Manual">
                              Manual
                            </option>
                          </select>
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-medium text-zinc-400">
                            Hostname
                          </span>

                          <input
                            value={
                              machineDraft.hostname ??
                              ""
                            }
                            onChange={(event) =>
                              updateMachineDraft(
                                "hostname",
                                event.target.value,
                              )
                            }
                            placeholder="alpha-prime.local"
                            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-red-600/60"
                          />
                        </label>

                        <label className="block md:col-span-2">
                          <span className="mb-2 block text-xs font-medium text-zinc-400">
                            IP Address
                          </span>

                          <input
                            value={
                              machineDraft.ipAddress ??
                              ""
                            }
                            onChange={(event) =>
                              updateMachineDraft(
                                "ipAddress",
                                event.target.value,
                              )
                            }
                            placeholder="192.168.1.100"
                            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-red-600/60"
                          />
                        </label>
                      </div>
                    </div>

                    {/* ----------------------------------------------
                 * NOTES
                 * ---------------------------------------------- */}

                    <div className="mt-7 border-t border-white/10 pt-6">
                      <label className="block">
                        <span className="mb-2 block text-xs font-medium text-zinc-400">
                          Notes
                        </span>

                        <textarea
                          rows={5}
                          value={
                            machineDraft.notes ??
                            ""
                          }
                          onChange={(event) =>
                            updateMachineDraft(
                              "notes",
                              event.target.value,
                            )
                          }
                          placeholder="Maintenance notes, configuration details, accessories, or other machine information..."
                          className="w-full resize-y rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-red-600/60"
                        />
                      </label>
                    </div>
                  </div>

                  {/* ------------------------------------------------
               * MODAL FOOTER
               * ------------------------------------------------ */}

                  <div className="flex items-center justify-end gap-2 border-t border-white/10 px-5 py-4">
                    <button
                      type="button"
                      onClick={
                        cancelEditMachine
                      }
                      disabled={
                        savingMachine
                      }
                      className="rounded-lg border border-white/10 px-4 py-2 text-xs text-zinc-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void saveMachineChanges()
                      }
                      disabled={
                        savingMachine ||
                        !machineDraft.name.trim() ||
                        !machineDraft.manufacturer.trim() ||
                        !machineDraft.model.trim()
                      }
                      className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {savingMachine
                        ? "Saving..."
                        : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            )}
        </section>
      );
    }

    if (
      activeSection ===
      "Machines"
    ) {
      return (
        <MachinesPage
          machines={
            machines
          }
          onCreateMachine={
            handleCreateMachine
          }
          onDeleteMachine={
            handleDeleteMachine
          }
          onOpenMachine={
            handleOpenMachine
          }
        />
      );
    }

    if (
      activeSection ===
      "Material Detail" &&
      selectedMaterial
    ) {
      const materialPercentage =
        getMaterialRemainingPercentage(
          selectedMaterial,
        );

      const materialInventoryStatus =
        getMaterialInventoryStatus(
          selectedMaterial,
        );

      return (
        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div className="flex items-center">
              <button
                type="button"
                onClick={() =>
                  handleSectionChange(
                    "Materials",
                  )
                }
                className="text-xs text-zinc-400 transition hover:text-white"
              >
                ← Materials
              </button>

              <div className="ml-3">
                <h2 className="text-sm font-semibold text-zinc-100">
                  {
                    selectedMaterial.name
                  }
                </h2>

                <p className="mt-1 text-xs text-zinc-500">
                  {
                    selectedMaterial.brand
                  }
                  {" · "}
                  {
                    selectedMaterial.materialType
                  }
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={
                beginEditMaterial
              }
              className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-zinc-200 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-white"
            >
              Edit Material
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
                <h3 className="text-sm font-semibold text-zinc-100">
                  Material Information
                </h3>

                <div className="mt-4 space-y-3 text-sm">
                  <DetailRow label="Name" value={selectedMaterial.name} />
                  <DetailRow label="Brand" value={selectedMaterial.brand} />
                  <DetailRow label="Category" value={selectedMaterial.category} />
                  <DetailRow label="Material Type" value={selectedMaterial.materialType} />
                  <DetailRow label="Color" value={selectedMaterial.color ?? "Not set"} />
                  <DetailRow
                    label="Diameter"
                    value={
                      selectedMaterial.diameter !== undefined
                        ? `${selectedMaterial.diameter} mm`
                        : "Not set"
                    }
                  />
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
                <h3 className="text-sm font-semibold text-zinc-100">
                  Inventory
                </h3>

                <div className="mt-4 space-y-3 text-sm">
                  <DetailRow
                    label="Initial Weight"
                    value={
                      selectedMaterial.initialWeightGrams !== undefined
                        ? `${selectedMaterial.initialWeightGrams} g`
                        : "Not set"
                    }
                  />

                  <DetailRow
                    label="Remaining Weight"
                    value={
                      selectedMaterial.remainingWeightGrams !== undefined
                        ? `${selectedMaterial.remainingWeightGrams} g`
                        : "Not set"
                    }
                  />

                  <DetailRow
                    label="Cost"
                    value={
                      selectedMaterial.cost !== undefined
                        ? `$${selectedMaterial.cost.toFixed(2)}`
                        : "Not set"
                    }
                  />

                  <DetailRow
                    label="Storage Location"
                    value={
                      selectedMaterial.storageLocation ??
                      "Not set"
                    }
                  />

                  <div className="mt-5 border-t border-white/10 pt-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-zinc-500">
                        Inventory Status
                      </span>

                      <span
                        className={`rounded-md border px-2 py-1 text-[10px] font-medium ${getMaterialInventoryStatusClasses(
                          materialInventoryStatus,
                        )}`}
                      >
                        {
                          materialInventoryStatus
                        }
                      </span>
                    </div>

                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs text-zinc-500">
                          Remaining
                        </span>

                        <span className="text-xs font-medium text-zinc-300">
                          {materialPercentage !==
                            null
                            ? `${Math.round(
                              materialPercentage,
                            )}%`
                            : "Not set"}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className={`h-full rounded-full transition-all ${getMaterialProgressBarClasses(
                            materialInventoryStatus,
                          )}`}
                          style={{
                            width:
                              materialPercentage !==
                                null
                                ? `${materialPercentage}%`
                                : "0%",
                          }}
                        />
                      </div>

                      {materialInventoryStatus ===
                        "Low" && (
                          <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
                            Low material warning: this spool has 20% or less remaining.
                          </div>
                        )}

                      {materialInventoryStatus ===
                        "Empty" && (
                          <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                            This material is empty.
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
                <h3 className="text-sm font-semibold text-zinc-100">
                  Drying
                </h3>

                <div className="mt-4 space-y-3 text-sm">
                  <DetailRow
                    label="Drying Status"
                    value={selectedMaterial.dryingStatus}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
                <h3 className="text-sm font-semibold text-zinc-100">
                  Color
                </h3>

                <div className="mt-4 space-y-3 text-sm">
                  <DetailRow
                    label="Color Name"
                    value={selectedMaterial.color ?? "Not set"}
                  />
                  <DetailRow
                    label="Hex"
                    value={selectedMaterial.colorHex ?? "Not set"}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5 xl:col-span-2">
                <h3 className="text-sm font-semibold text-zinc-100">
                  Notes
                </h3>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-400">
                  {selectedMaterial.notes ?? "No notes added."}
                </p>
              </div>
            </div>
          </div>

          {editingMaterial &&
            materialDraft && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
                <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-white/10 bg-zinc-950 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-100">
                        Edit Material
                      </h3>

                      <p className="mt-1 text-xs text-zinc-500">
                        Update material information and inventory.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={
                        cancelEditMaterial
                      }
                      className="text-xl leading-none text-zinc-500 transition hover:text-white"
                    >
                      ×
                    </button>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto p-5">
                    <div>
                      <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Material Information
                      </h4>

                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-xs font-medium text-zinc-400">
                            Material Name
                          </span>

                          <input
                            autoFocus
                            value={
                              materialDraft.name
                            }
                            onChange={(event) =>
                              updateMaterialDraft(
                                "name",
                                event.target.value,
                              )
                            }
                            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-red-600/60"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-medium text-zinc-400">
                            Brand
                          </span>

                          <input
                            value={
                              materialDraft.brand
                            }
                            onChange={(event) =>
                              updateMaterialDraft(
                                "brand",
                                event.target.value,
                              )
                            }
                            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-red-600/60"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-medium text-zinc-400">
                            Category
                          </span>

                          <select
                            value={
                              materialDraft.category
                            }
                            onChange={(event) =>
                              updateMaterialDraft(
                                "category",
                                event.target.value as MaterialCategory,
                              )
                            }
                            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-red-600/60"
                          >
                            <option value="Filament">
                              Filament
                            </option>
                            <option value="Resin">
                              Resin
                            </option>
                            <option value="Sheet">
                              Sheet
                            </option>
                            <option value="Powder">
                              Powder
                            </option>
                            <option value="Other">
                              Other
                            </option>
                          </select>
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-medium text-zinc-400">
                            Material Type
                          </span>

                          <input
                            value={
                              materialDraft.materialType
                            }
                            onChange={(event) =>
                              updateMaterialDraft(
                                "materialType",
                                event.target.value,
                              )
                            }
                            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-red-600/60"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-medium text-zinc-400">
                            Color
                          </span>

                          <input
                            value={
                              materialDraft.color ??
                              ""
                            }
                            onChange={(event) =>
                              updateMaterialDraft(
                                "color",
                                event.target.value,
                              )
                            }
                            placeholder="Black"
                            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-red-600/60"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-medium text-zinc-400">
                            Color Hex
                          </span>

                          <input
                            value={
                              materialDraft.colorHex ??
                              ""
                            }
                            onChange={(event) =>
                              updateMaterialDraft(
                                "colorHex",
                                event.target.value,
                              )
                            }
                            placeholder="#000000"
                            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-red-600/60"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-medium text-zinc-400">
                            Diameter (mm)
                          </span>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                              materialDraft.diameter ??
                              ""
                            }
                            onChange={(event) =>
                              updateMaterialDraft(
                                "diameter",
                                event.target.value === ""
                                  ? undefined
                                  : Number(
                                    event.target.value,
                                  ),
                              )
                            }
                            placeholder="1.75"
                            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-red-600/60"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="mt-7 border-t border-white/10 pt-6">
                      <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Inventory
                      </h4>

                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-xs font-medium text-zinc-400">
                            Initial Weight (g)
                          </span>

                          <input
                            type="number"
                            min="0"
                            value={
                              materialDraft.initialWeightGrams ??
                              ""
                            }
                            onChange={(event) =>
                              updateMaterialDraft(
                                "initialWeightGrams",
                                event.target.value === ""
                                  ? undefined
                                  : Number(
                                    event.target.value,
                                  ),
                              )
                            }
                            placeholder="1000"
                            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-red-600/60"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-medium text-zinc-400">
                            Remaining Weight (g)
                          </span>

                          <input
                            type="number"
                            min="0"
                            value={
                              materialDraft.remainingWeightGrams ??
                              ""
                            }
                            onChange={(event) =>
                              updateMaterialDraft(
                                "remainingWeightGrams",
                                event.target.value === ""
                                  ? undefined
                                  : Number(
                                    event.target.value,
                                  ),
                              )
                            }
                            placeholder="1000"
                            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-red-600/60"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-medium text-zinc-400">
                            Cost
                          </span>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                              materialDraft.cost ??
                              ""
                            }
                            onChange={(event) =>
                              updateMaterialDraft(
                                "cost",
                                event.target.value === ""
                                  ? undefined
                                  : Number(
                                    event.target.value,
                                  ),
                              )
                            }
                            placeholder="24.99"
                            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-red-600/60"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-medium text-zinc-400">
                            Storage Location
                          </span>

                          <input
                            value={
                              materialDraft.storageLocation ??
                              ""
                            }
                            onChange={(event) =>
                              updateMaterialDraft(
                                "storageLocation",
                                event.target.value,
                              )
                            }
                            placeholder="AMS HT"
                            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-red-600/60"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="mt-7 border-t border-white/10 pt-6">
                      <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Drying
                      </h4>

                      <label className="block">
                        <span className="mb-2 block text-xs font-medium text-zinc-400">
                          Drying Status
                        </span>

                        <select
                          value={
                            materialDraft.dryingStatus
                          }
                          onChange={(event) =>
                            updateMaterialDraft(
                              "dryingStatus",
                              event.target.value as MaterialDryingStatus,
                            )
                          }
                          className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-red-600/60"
                        >
                          <option value="Dry">
                            Dry
                          </option>
                          <option value="Needs Drying">
                            Needs Drying
                          </option>
                          <option value="Drying">
                            Drying
                          </option>
                          <option value="Unknown">
                            Unknown
                          </option>
                        </select>
                      </label>
                    </div>

                    <div className="mt-7 border-t border-white/10 pt-6">
                      <label className="block">
                        <span className="mb-2 block text-xs font-medium text-zinc-400">
                          Notes
                        </span>

                        <textarea
                          rows={5}
                          value={
                            materialDraft.notes ??
                            ""
                          }
                          onChange={(event) =>
                            updateMaterialDraft(
                              "notes",
                              event.target.value,
                            )
                          }
                          placeholder="Storage, drying, print settings, or other material notes..."
                          className="w-full resize-y rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-red-600/60"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-white/10 px-5 py-4">
                    <button
                      type="button"
                      onClick={
                        cancelEditMaterial
                      }
                      disabled={
                        savingMaterial
                      }
                      className="rounded-lg border border-white/10 px-4 py-2 text-xs text-zinc-400 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void saveMaterialChanges()
                      }
                      disabled={
                        savingMaterial ||
                        !materialDraft.name.trim() ||
                        !materialDraft.brand.trim() ||
                        !materialDraft.materialType.trim()
                      }
                      className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {savingMaterial
                        ? "Saving..."
                        : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            )}
        </section>
      );
    }

    if (
      activeSection ===
      "Materials"
    ) {
      return (
        <MaterialsPage
          materials={
            materials
          }
          onCreateMaterial={
            handleCreateMaterial
          }
          onDeleteMaterial={
            handleDeleteMaterial
          }
          onOpenMaterial={
            handleOpenMaterial
          }
        />
      );
    }

    if (
      activeSection ===
      "Projects"
    ) {
      return (
        <ProjectsPage
          projects={
            projects
          }
          onCreateProject={
            handleCreateProject
          }
          onRenameProject={
            handleRenameProject
          }
          onDeleteProject={
            handleDeleteProject
          }
          onOpenProject={
            handleOpenProject
          }
        />
      );
    }

    /*
     * ---------------------------------------------------------
     * COLLECTION LIST
     * ---------------------------------------------------------
     */

    if (
      activeSection ===
      "Collections"
    ) {
      return (
        <CollectionsPage
          collections={
            collections
          }
          onCreateCollection={
            handleCreateCollection
          }
          onRenameCollection={
            handleRenameCollection
          }
          onDeleteCollection={
            handleDeleteCollection
          }
          onOpenCollection={
            handleOpenCollection
          }
        />
      );
    }

    /*
     * ---------------------------------------------------------
     * LIBRARY EMPTY
     * ---------------------------------------------------------
     */

    if (
      libraryIsEmpty
    ) {
      return (
        <EmptyLibraryState
          onImport={
            handleImport
          }
        />
      );
    }

    /*
     * ---------------------------------------------------------
     * FAVORITES EMPTY
     * ---------------------------------------------------------
     */

    if (
      favoritesAreEmpty
    ) {
      return (
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-3xl text-zinc-500">
              ♡
            </div>

            <h2 className="text-lg font-semibold text-zinc-100">
              No favorites yet
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Add models you use often to Favorites so you can
              quickly find them here.
            </p>

            <button
              type="button"
              onClick={() =>
                handleSectionChange(
                  "Library",
                )
              }
              className="mt-5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500"
            >
              Browse Library
            </button>
          </div>
        </div>
      );
    }

    /*
     * ---------------------------------------------------------
     * RECENT EMPTY
     * ---------------------------------------------------------
     */

    if (
      recentIsEmpty
    ) {
      return (
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-3xl text-zinc-500">
              ↻
            </div>

            <h2 className="text-lg font-semibold text-zinc-100">
              No recent assets yet
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Open assets from your Library and they will appear
              here automatically.
            </p>

            <button
              type="button"
              onClick={() =>
                handleSectionChange(
                  "Library",
                )
              }
              className="mt-5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500"
            >
              Browse Library
            </button>
          </div>
        </div>
      );
    }

    /*
     * ---------------------------------------------------------
     * COLLECTION DETAIL EMPTY
     * ---------------------------------------------------------
     */

    if (
      collectionIsEmpty
    ) {
      return (
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center border-b border-white/10 px-6 py-4">
            <button
              type="button"
              onClick={() =>
                handleSectionChange(
                  "Collections",
                )
              }
              className="text-xs text-zinc-400 transition hover:text-white"
            >
              ← Collections
            </button>

            <span className="ml-3 text-sm font-semibold text-zinc-100">
              {
                selectedCollection?.name
              }
            </span>
          </div>

          <div className="flex flex-1 items-center justify-center p-8">
            <div className="max-w-md text-center">
              <h2 className="text-lg font-semibold text-zinc-100">
                Collection is empty
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Add assets to this collection from the Library
                context menu.
              </p>
            </div>
          </div>
        </section>
      );
    }

    /*
     * ---------------------------------------------------------
     * PROJECT DETAIL EMPTY
     * ---------------------------------------------------------
     */

    if (
      projectIsEmpty
    ) {
      return (
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center border-b border-white/10 px-6 py-4">
            <button
              type="button"
              onClick={() =>
                handleSectionChange(
                  "Projects",
                )
              }
              className="text-xs text-zinc-400 transition hover:text-white"
            >
              ← Projects
            </button>

            <div className="ml-3">
              <div className="flex items-center gap-2">
                {selectedProject && (
                  <>
                    {editingProjectName ? (
                      <div className="flex items-center gap-1">
                        <input
                          autoFocus
                          value={
                            projectNameDraft
                          }
                          onChange={(event) =>
                            setProjectNameDraft(
                              event.target.value,
                            )
                          }
                          onKeyDown={(event) => {
                            if (
                              event.key ===
                              "Enter"
                            ) {
                              void saveProjectName();
                            }

                            if (
                              event.key ===
                              "Escape"
                            ) {
                              cancelEditProjectName();
                            }
                          }}
                          className="w-48 rounded-md border border-white/10 bg-zinc-950 px-2 py-1 text-sm font-semibold text-zinc-100 outline-none focus:border-red-600/60"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            void saveProjectName()
                          }
                          className="rounded-md bg-red-600 px-2 py-1 text-[10px] font-medium text-white transition hover:bg-red-500"
                        >
                          Save
                        </button>

                        <button
                          type="button"
                          onClick={
                            cancelEditProjectName
                          }
                          className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-zinc-400 transition hover:bg-white/5 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={
                          beginEditProjectName
                        }
                        className="text-sm font-semibold text-zinc-100 transition hover:text-red-400"
                        title="Rename project"
                      >
                        {
                          selectedProject.name
                        }
                      </button>
                    )}
                  </>
                )}

                {selectedProject && (
                  <select
                    value={
                      selectedProject.status
                    }
                    onChange={(event) =>
                      void handleUpdateProjectStatus(
                        selectedProject,
                        event.target.value as ProjectStatus,
                      )
                    }
                    className="rounded-md border border-white/10 bg-zinc-900 px-2 py-1 text-[10px] text-zinc-300 outline-none transition hover:border-white/20 focus:border-red-600/60"
                  >
                    <option value="Planning">
                      Planning
                    </option>

                    <option value="In Progress">
                      In Progress
                    </option>

                    <option value="Paused">
                      Paused
                    </option>

                    <option value="Completed">
                      Completed
                    </option>

                    <option value="Archived">
                      Archived
                    </option>
                  </select>
                )}
              </div>

              {selectedProject && (
                <div className="mt-2">
                  {editingProjectDescription ? (
                    <div className="flex items-start gap-2">
                      <textarea
                        autoFocus
                        value={
                          projectDescriptionDraft
                        }
                        onChange={(event) =>
                          setProjectDescriptionDraft(
                            event.target.value,
                          )
                        }
                        onKeyDown={(event) => {
                          if (
                            event.key ===
                            "Escape"
                          ) {
                            cancelEditProjectDescription();
                          }

                          if (
                            event.key ===
                            "Enter" &&
                            (event.metaKey ||
                              event.ctrlKey)
                          ) {
                            void saveProjectDescription();
                          }
                        }}
                        rows={2}
                        placeholder="Add project description..."
                        className="w-80 resize-none rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-red-600/60"
                      />

                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            void saveProjectDescription()
                          }
                          className="rounded-md bg-red-600 px-2 py-1 text-[10px] font-medium text-white transition hover:bg-red-500"
                        >
                          Save
                        </button>

                        <button
                          type="button"
                          onClick={
                            cancelEditProjectDescription
                          }
                          className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-zinc-400 transition hover:bg-white/5 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={
                        beginEditProjectDescription
                      }
                      className="max-w-xl text-left text-xs text-zinc-500 transition hover:text-zinc-300"
                    >
                      {selectedProject.description
                        ? selectedProject.description
                        : "Add project description…"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center p-8">
            <div className="max-w-md text-center">
              <h2 className="text-lg font-semibold text-zinc-100">
                Project has no assets yet
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Add assets to this project from the Library context menu.
              </p>
            </div>
          </div>
        </section>
      );
    }

    /*
     * ---------------------------------------------------------
     * NORMAL ASSET VIEW
     * ---------------------------------------------------------
     */

    return (
      <>
        <section className="flex min-w-0 flex-1 flex-col">
          {activeSection ===
            "Collection Detail" && (
              <div className="flex items-center border-b border-white/10 px-6 py-3">
                <button
                  type="button"
                  onClick={() =>
                    handleSectionChange(
                      "Collections",
                    )
                  }
                  className="text-xs text-zinc-400 transition hover:text-white"
                >
                  ← Collections
                </button>

                <span className="ml-3 text-sm font-semibold text-zinc-100">
                  {
                    selectedCollection?.name
                  }
                </span>
              </div>
            )}

          {activeSection ===
            "Project Detail" && (
              <div className="flex items-center border-b border-white/10 px-6 py-3">
                <button
                  type="button"
                  onClick={() =>
                    handleSectionChange(
                      "Projects",
                    )
                  }
                  className="text-xs text-zinc-400 transition hover:text-white"
                >
                  ← Projects
                </button>

                <div className="ml-3">
                  <div className="flex items-center gap-2">
                    {selectedProject && (
                      <>
                        {editingProjectName ? (
                          <div className="flex items-center gap-1">
                            <input
                              autoFocus
                              value={
                                projectNameDraft
                              }
                              onChange={(event) =>
                                setProjectNameDraft(
                                  event.target.value,
                                )
                              }
                              onKeyDown={(event) => {
                                if (
                                  event.key ===
                                  "Enter"
                                ) {
                                  void saveProjectName();
                                }

                                if (
                                  event.key ===
                                  "Escape"
                                ) {
                                  cancelEditProjectName();
                                }
                              }}
                              className="w-48 rounded-md border border-white/10 bg-zinc-950 px-2 py-1 text-sm font-semibold text-zinc-100 outline-none focus:border-red-600/60"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                void saveProjectName()
                              }
                              className="rounded-md bg-red-600 px-2 py-1 text-[10px] font-medium text-white transition hover:bg-red-500"
                            >
                              Save
                            </button>

                            <button
                              type="button"
                              onClick={
                                cancelEditProjectName
                              }
                              className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-zinc-400 transition hover:bg-white/5 hover:text-white"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={
                              beginEditProjectName
                            }
                            className="text-sm font-semibold text-zinc-100 transition hover:text-red-400"
                            title="Rename project"
                          >
                            {
                              selectedProject.name
                            }
                          </button>
                        )}
                      </>
                    )}

                    {selectedProject && (
                      <select
                        value={
                          selectedProject.status
                        }
                        onChange={(event) =>
                          void handleUpdateProjectStatus(
                            selectedProject,
                            event.target.value as ProjectStatus,
                          )
                        }
                        className="rounded-md border border-white/10 bg-zinc-900 px-2 py-1 text-[10px] text-zinc-300 outline-none transition hover:border-white/20 focus:border-red-600/60"
                      >
                        <option value="Planning">
                          Planning
                        </option>

                        <option value="In Progress">
                          In Progress
                        </option>

                        <option value="Paused">
                          Paused
                        </option>

                        <option value="Completed">
                          Completed
                        </option>

                        <option value="Archived">
                          Archived
                        </option>
                      </select>
                    )}
                  </div>

                  {selectedProject && (
                    <div className="mt-2">
                      {editingProjectDescription ? (
                        <div className="flex items-start gap-2">
                          <textarea
                            autoFocus
                            value={
                              projectDescriptionDraft
                            }
                            onChange={(event) =>
                              setProjectDescriptionDraft(
                                event.target.value,
                              )
                            }
                            onKeyDown={(event) => {
                              if (
                                event.key ===
                                "Escape"
                              ) {
                                cancelEditProjectDescription();
                              }

                              if (
                                event.key ===
                                "Enter" &&
                                (event.metaKey ||
                                  event.ctrlKey)
                              ) {
                                void saveProjectDescription();
                              }
                            }}
                            rows={2}
                            placeholder="Add project description..."
                            className="w-80 resize-none rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-red-600/60"
                          />

                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                void saveProjectDescription()
                              }
                              className="rounded-md bg-red-600 px-2 py-1 text-[10px] font-medium text-white transition hover:bg-red-500"
                            >
                              Save
                            </button>

                            <button
                              type="button"
                              onClick={
                                cancelEditProjectDescription
                              }
                              className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-zinc-400 transition hover:bg-white/5 hover:text-white"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={
                            beginEditProjectDescription
                          }
                          className="max-w-xl text-left text-xs text-zinc-500 transition hover:text-zinc-300"
                        >
                          {selectedProject.description
                            ? selectedProject.description
                            : "Add project description…"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

          <LibraryPage
            assets={
              filteredAssets
            }
            selectedAsset={
              selectedAsset ??
              filteredAssets[0] ??
              assets[0]
            }
            viewMode={
              viewMode
            }
            onViewModeChange={
              setViewMode
            }
            technologyFilter={
              technologyFilter
            }
            onTechnologyFilterChange={
              setTechnologyFilter
            }
            onAssetSelect={
              handleAssetSelect
            }
            onDelete={
              handleDeleteAsset
            }
            onUpdateFavorite={
              handleUpdateFavorite
            }
            collections={
              collections
            }
            onAddToCollection={
              handleAddToCollection
            }
            onCreateCollection={
              handleCreateCollection
            }
            onRemoveFromCollection={
              activeSection ===
                "Collection Detail"
                ? handleRemoveFromCollection
                : undefined
            }
            projects={
              projects
            }
            onAddToProject={
              handleAddToProject
            }
            onCreateProject={
              handleCreateProject
            }
            onRemoveFromProject={
              activeSection ===
                "Project Detail"
                ? handleRemoveFromProject
                : undefined
            }
          />
        </section>

        {filteredAssets.length >
          0 &&
          selectedAsset && (
            <InspectorPanel
              asset={
                selectedAsset
              }
              onDelete={
                handleDeleteAsset
              }
            />
          )}
      </>
    );
  }

  /*
   * ---------------------------------------------------------
   * APP UI
   * ---------------------------------------------------------
   */

  return (
    <AppShell
      activeSection={
        activeSection ===
          "Collection Detail"
          ? "Collections"
          : activeSection ===
            "Project Detail"
            ? "Projects"
            : activeSection ===
              "Machine Detail"
              ? "Machines"
              : activeSection
      }
      onSectionChange={
        handleSectionChange
      }
      search={
        search
      }
      onSearchChange={
        setSearch
      }
      onImport={
        handleImport
      }
    >
      <div className="flex min-h-0 flex-1">
        {renderContent()}
      </div>
    </AppShell>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
}

function DetailRow({
  label,
  value,
}: DetailRowProps) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
      <span className="text-zinc-500">
        {
          label
        }
      </span>

      <span className="text-right text-zinc-200">
        {
          value
        }
      </span>
    </div>
  );
}

export default App;
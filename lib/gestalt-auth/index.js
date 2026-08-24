export {
  createGestaltAuthStorage,
  isGestaltProductionHost,
} from './cookie-storage.js'

export {
  getSupabase,
  isSupabaseConfigured,
  readSupabaseEnv,
  getGestaltOwnerEmail,
  getGestaltOwnerEmails,
  isGestaltOwnerEmail,
  resetSupabaseClient,
} from './supabase.js'

export {
  GESTALT_PRODUCTS,
  getProductByCode,
  mapProductRow,
  fetchAppProducts,
  isProductEntryLive,
  getProductAppUrl,
  getProductTryUrl,
  getProductLandingUrl,
  getProductArticlesUrl,
  getPortfolioOrigin,
  getAuthCallbackUrl,
  isOAuthReturn,
  isProductLive,
} from './products.js'

export {
  loginWithGoogle,
  logoutAuth,
  getAuthSessionUser,
  subscribeToAuthChanges,
  fetchPortfolioUser,
  fetchProductAccess,
  hasProductAccess,
  hasGestaltProductAccess,
  provisionProductUser,
  grantProductAccess,
  ensureOwnerBootstrap,
  submitAccessRequest,
  listPendingAccessRequests,
  resolveAccessRequest,
  searchAuthUsersByEmail,
  ensureProductAccess,
} from './access.js'

export {
  resolveArtifactHref,
  mapArtifactRow,
  fetchPublicArtifacts,
  fetchArtifactsByProduct,
  fetchAllArtifacts,
} from './artifacts.js'

export {
  fetchExperiences,
  localizeExperience,
  fetchExperienceCaseStudy,
  localizeCaseStudy,
  CASE_STUDY_SECTION_KEYS,
} from './experience.js'

export {
  mapTrackRow,
  mapJsonTrack,
  fetchPublicTracks,
  fetchAllTracks,
} from './tracks.js'

export {
  fetchAllQuests,
  fetchProductsMeta,
} from './quests.js'

export {
  mapHumanRow,
  localizeRoleTitle,
  fetchHuman,
} from './human.js'

export {
  localizeProject,
  fetchProjects,
  fetchProjectByCode,
  fetchProjectsCatalog,
  fetchProjectDetail,
} from './projects.js'

export {
  fetchHumanStatements,
} from './statements.js'

export {
  pickLocaleField,
  normalizePublicationBody,
  mapPublicationRow,
  fetchPublicPublications,
  fetchPublicationBySlug,
  fetchPublicationsCatalog,
  fetchPublicationDetail,
} from './publications.js'

export {
  USE_CASE_PRODUCTS,
  mapUseCaseRow,
  fetchUseCasesByProduct,
  fetchAllUseCases,
  fetchUseCaseBySlug,
  reorderUseCases,
  deleteUseCase,
  buildDefaultUseCase,
  createUseCase,
  updateUseCase,
  updateUseCaseStatus,
} from './use-cases.js'

export {
  KIT_KINDS,
  mapKitDocRow,
  fetchKitDocs,
  fetchKitDoc,
  updateKitDoc,
} from './kit-docs.js'

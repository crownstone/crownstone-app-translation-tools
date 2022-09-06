const FILE_EXCLUSIONS = {
  'DebugIconSelection': true,
  'IconDebug': true,
  'development': true,
  'styles':true,
};

const FILE_KEY_EXCEPTIONS = {
  'DebugCalls':true,
  'AppUtil': true,
  'LocationHandler': true,
  'StoneUtil': true,
  'Tabs': true,
  '__UNIVERSAL': true
};

const ROOT = "/Users/alex/Dropbox/Crownstone/Projects/crownstone-app/app/ts/"
const PATH_EXCLUSIONS = {
  [ROOT + "views/cameraViews"] : true,
  [ROOT + "views/dev"] : true,
  [ROOT + "views/settingsViews/dev"] : true,

}

module.exports = {
  FILE_EXCLUSIONS,
  FILE_KEY_EXCEPTIONS,
  PATH_EXCLUSIONS,
  ENGLISH_BASE_LANGUAGE_PATH: ROOT + "languages/en/us/en_us.ts",
  BASE_CODE_PATH:             ROOT,
  LOCALIZATION_BASE_PATH:     ROOT + "languages",
}

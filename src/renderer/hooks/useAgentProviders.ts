import { isEmpty, uniqBy } from 'lodash'
import { useCallback, useMemo } from 'react'
import { useSettings } from './useSettings'
import {agentCard as mockAgentCard} from "src/shared/mock/agentCard";

export const useAgentProviders = () => {
  const { settings, setSettings } = useSettings()
  
  //TODO: ADD SYSTEM PROVIDERS
  const allAgentCards = useMemo(
    () => [...(settings.agentProviders || [mockAgentCard])],
    [settings.agentProviders]
  )
  const agentProviderSettings = settings.agentProviderSettings;

  const agentProviders = useMemo(
    () => allAgentCards.map((p) => {
      if (!isEmpty(p.chatboxSettingId)) {
        return null;
      }
      const agentCardSetting = agentProviderSettings?.[p.chatboxSettingId || ""];
      return {
        ...p,
        ...agentCardSetting
      }
    }).filter((p) => !!p)
    , [agentProviderSettings]
  )


  // const favoritedModels = useMemo(
  //   () =>
  //     settings.favoritedModels
  //       ?.map((m) => {
  //         const provider = providers.find((p) => p.id === m.provider)
  //         const model = (provider?.models || provider?.defaultSettings?.models)?.find((mm) => mm.modelId === m.model)

  //         if (provider && model) {
  //           return {
  //             provider,
  //             model,
  //           }
  //         }
  //       })
  //       .filter((fm) => !!fm),
  //   [settings.favoritedModels, providers]
  // )

  // const favoriteModel = useCallback(
  //   (provider: string, model: string) => {
  //     setSettings({
  //       favoritedModels: [
  //         ...(settings.favoritedModels || []),
  //         {
  //           provider,
  //           model,
  //         },
  //       ],
  //     })
  //   },
  //   [settings, setSettings]
  // )

  // const unfavoriteModel = useCallback(
  //   (provider: string, model: string) => {
  //     setSettings({
  //       favoritedModels: (settings.favoritedModels || []).filter((m) => m.provider !== provider || m.model !== model),
  //     })
  //   },
  //   [settings, setSettings]
  // )

  // const isFavoritedModel = useCallback(
  //   (provider: string, model: string) =>
  //     !!favoritedModels?.find((m) => m.provider?.id === provider && m.model?.modelId === model),
  //   [favoritedModels]
  // )

  return {
    agentProviders
    // favoritedModels,
    // favoriteModel,
    // unfavoriteModel,
    // isFavoritedModel,
  }
}

import { useAtom } from 'jotai'
import { useImmerAtom } from 'jotai-immer'
import { useCallback } from 'react'
import type { AgentProviderSettings, ProviderSettings, Settings } from 'src/shared/types'
import { settingsAtom } from '@/stores/atoms'

/**
 * Custom hook to manage application settings state
 * @returns An object containing the current settings and a setter function
 */
export const useSettings = () => {
  const [settings, _setSettings] = useAtom(settingsAtom)

  const setSettings = useCallback(
    (update: Partial<Settings> | ((prev: Settings) => Partial<Settings>)) => {
      _setSettings((prev) => {
        const val = typeof update === 'function' ? update(prev) : update
        return {
          ...prev,
          ...val,
        }
      })
    },
    [_setSettings]
  )

  return {
    settings,
    setSettings,
  }
}

/**
 * Custom hook to manage settings for a specific provider
 * @param providerId - The unique identifier of the provider
 * @returns An object containing the provider's settings and a setter function
 */
export const useProviderSettings = (providerId: string) => {
  const { settings, setSettings } = useSettings()

  const providerSettings = settings.providers?.[providerId]

  const setProviderSettings = (
    val: Partial<ProviderSettings> | ((prev: ProviderSettings | undefined) => Partial<ProviderSettings>)
  ) => {
    setSettings((currentSettings) => {
      const currentProviderSettings = currentSettings.providers?.[providerId] || {}
      const newProviderSettings = typeof val === 'function' ? val(currentProviderSettings) : val

      return {
        providers: {
          ...(currentSettings.providers || {}),
          [providerId]: {
            ...currentProviderSettings,
            ...newProviderSettings,
          },
        },
      }
    })
  }

  return {
    providerSettings,
    setProviderSettings,
  }
}

export const useAgentProviderSettings = (agentProviderId: string) => {
  const { settings, setSettings } = useSettings()

  const agentProvidersSetting = settings.agentProviderSettings?.[agentProviderId];

  const setProviderSettings = (
    val: Partial<AgentProviderSettings> | ((prev: AgentProviderSettings | undefined) => Partial<AgentProviderSettings>)
  ) => {
    setSettings((currentSettings) => {
      const currentAgent = currentSettings.agentProviderSettings?.[agentProviderId] || {}
      const newAgentSetting = typeof val === 'function' ? val(currentAgent) : val

      return {
        agentProviderSettings: {
          ...(currentSettings.agentProviderSettings || {}),
          [agentProviderId]: {
            ...currentAgent,
            ...newAgentSetting,
          },
        },
      }
    })
  }

  return {
    agentProvidersSetting,
    setAgentProviderSettings: setProviderSettings,
  }
}
/**
 * Custom hook using Jotai Immer for immutable settings updates
 * Provides direct mutation-style updates while maintaining immutability
 * @returns A tuple containing the settings state and an immer-based setter
 * @see https://jotai.org/docs/extensions/immer
 */
export const useImmerSettings = () => {
  return useImmerAtom(settingsAtom)
}

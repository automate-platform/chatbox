import { useAtom } from 'jotai'
import { useImmerAtom } from 'jotai-immer'
import { useCallback } from 'react'
import type { AgentCard, AgentProviderSettings, ProviderSettings, Settings } from 'src/shared/types'
import { useSettings } from './useSettings'

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

export const useAgentCard = (agentProviderId: string) => {
    const { settings, setSettings } = useSettings();

    const agentCard = settings.agentProviders?.find(item => item.chatboxSettingId === agentProviderId);

    // const setAgentCard = 
    const setAgentCard = (
        val: Partial<AgentCard> | ((prev: AgentCard | undefined) => Partial<AgentCard>)
    ) => {
        setSettings((currentSetting) => {
            const currentAgentCard = settings.agentProviders?.find(item => item.chatboxSettingId === agentProviderId) || {};
            const newAgentCard = typeof val === 'function' ? val(currentAgentCard) : val
            return {
                agentProviders: [
                    ...(currentSetting.agentProviders?.map(item => item.chatboxSettingId === newAgentCard.chatboxSettingId ? newAgentCard : item) || [newAgentCard]),
                ]
            }
        })
    }

    return {
        agentCard,
        setAgentCard
    }
}
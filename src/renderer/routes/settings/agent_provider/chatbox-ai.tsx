import {
  Alert,
  Badge,
  Button,
  Flex,
  Modal,
  Paper,
  PasswordInput,
  Progress,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core'
import {
  IconArrowRight,
  IconBulb,
  IconCircleCheckFilled,
  IconCircleMinus,
  IconCirclePlus,
  IconExclamationCircle,
  IconExternalLink,
  IconEye,
  IconHelp,
  IconRefresh,
  IconRestore,
  IconTool,
} from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useAtomValue } from 'jotai'
import { useCallback, useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { type ModelProvider, ModelProviderEnum } from 'src/shared/types'
import useChatboxAIModels from '@/hooks/useChatboxAIModels'
import { useProviderSettings, useSettings } from '@/hooks/useSettings'
import { trackingEvent } from '@/packages/event'
import { getLicenseDetailRealtime } from '@/packages/remote'
import platform from '@/platform'
import { languageAtom } from '@/stores/atoms'
import * as premiumActions from '@/stores/premiumActions'

const useLicenseDetail = (licenseKey: string) => {
  const { data: licenseDetail, ...others } = useQuery({
    queryKey: ['license-detail', licenseKey],
    queryFn: async () => {
      const res = await getLicenseDetailRealtime({ licenseKey })
      return res
    },
    enabled: !!licenseKey,
  })

  return {
    licenseDetail,
    ...others,
  }
}

export const Route = createFileRoute('/settings/agent_provider/chatbox-ai')({
  component: RouteComponent,
})

function RouteComponent() {
  const { t } = useTranslation()
  const language = useAtomValue(languageAtom)
  const providerId: ModelProvider = ModelProviderEnum.ChatboxAI
  const { providerSettings, setProviderSettings } = useProviderSettings(providerId)
  const { settings } = useSettings()

  const [licenseKey, setLicenseKey] = useState(settings.licenseKey || '')
  const [isDeactivating, setIsDeactivating] = useState(false)

  const activated = premiumActions.useAutoValidate()
  const [activating, setActivating] = useState(false)
  const [activateError, setActivateError] = useState<string>()

  const { allChatboxAIModels, chatboxAIModels, refetch: refetchChatboxAIModels } = useChatboxAIModels()

  const deleteModel = (modelId: string) => {
    setProviderSettings({
      excludedModels: [...(providerSettings?.excludedModels || []), modelId],
    })
  }

  const resetModels = () => {
    setProviderSettings({
      models: [],
      excludedModels: [],
    })
  }

  const activate = useCallback(async () => {
    try {
      setActivating(true)
      setActivateError(undefined)
      const result = await premiumActions.activate(licenseKey || '')
      if (!result.valid) {
        setActivateError(result.error)
      }
    } catch (e: any) {
      setActivateError(e?.message || 'unknow error')
    } finally {
      setActivating(false)
    }
  }, [licenseKey])

  // 自动激活
  useEffect(() => {
    if (
      !isDeactivating &&
      licenseKey &&
      licenseKey.length >= 36 &&
      !settings.licenseInstances?.[licenseKey] // 仅当 license key 还没激活
    ) {
      console.log('auto activate')
      activate()
    }
  }, [licenseKey, activate, settings.licenseInstances, isDeactivating])

  const [showFetchedModels, setShowFetchedModels] = useState(false)
  const handleFetchModels = () => {
    refetchChatboxAIModels()
    setShowFetchedModels(true)
  }

  const { licenseDetail } = useLicenseDetail(settings.licenseKey || '')
  return <></>
}

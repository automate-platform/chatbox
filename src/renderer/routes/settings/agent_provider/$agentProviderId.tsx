import { createModelDependencies } from '@/adapters'
import { ModelList } from '@/components/ModelList'
import PopoverConfirm from '@/components/PopoverConfirm'
import { useAgentProviderSettings, useProviderSettings, useSettings } from '@/hooks/useSettings'
import { streamText } from '@/packages/model-calls'
import { getModelSettingUtil } from '@/packages/model-setting-utils'
import platform from '@/platform'
import { add as addToast } from '@/stores/toastActions'
import NiceModal from '@ebay/nice-modal-react'
import JSONPretty from 'react-json-pretty';
import JSONPrettyMon from 'react-json-pretty/themes/monikai.css'
import {
  Button,
  Flex,
  Modal,
  PasswordInput,
  ScrollArea,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
  Tooltip
} from '@mantine/core'
import {
  IconBulb,
  IconCircleMinus,
  IconCirclePlus,
  IconDiscount2,
  IconExternalLink,
  IconEye,
  IconPlus,
  IconRefresh,
  IconRestore,
  IconTool,
  IconTrash
} from '@tabler/icons-react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { agentCard as mockAgentCard } from 'src/shared/mock/agentCard'
import { isEmpty } from 'lodash'
import { type ChangeEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AgentProviders, SystemProviders } from 'src/shared/defaults'
import { getModel } from 'src/shared/models'
import {
  AgentCard,
  MessageRoleEnum,
  type ModelOptionGroup,
  ModelProviderEnum,
  ModelProviderType,
  type ProviderModelInfo,
} from 'src/shared/types'
import {
  normalizeAzureEndpoint,
  normalizeClaudeHost,
  normalizeGeminiHost,
  normalizeOpenAIApiHostAndPath,
} from 'src/shared/utils'
import { useAgentCard } from '@/hooks/useAgentCard'
import { A2AClientInterface } from 'src/shared/utils/a2a_util'
import { useA2AClient } from '@/hooks/useA2AClient'

export const Route = createFileRoute('/settings/agent_provider/$agentProviderId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { agentProviderId } = Route.useParams()
  return <AgentProviderSettings key={agentProviderId} agentProviderId={agentProviderId} />
}

function AgentProviderSettings({ agentProviderId }: { agentProviderId: string }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { settings, setSettings } = useSettings()
  const a2aClient:A2AClientInterface = useA2AClient();
  const { agentProvidersSetting, setAgentProviderSettings } = useAgentProviderSettings(agentProviderId)
  const {agentCard: baseInfo, setAgentCard: setBaseInfo} = useAgentCard(agentProviderId);
  const [currentUrl, setCurrentUrl] = useState<string>(agentProvidersSetting?.agentUrl || "");
  const [currentAgentCard, setAgentCardInfo] = useState<AgentCard | any>(baseInfo);

  const [agentCardChecking, setAgentCardChecking] = useState(false);
  const [agentCardSaving, setAgentCardSaving] = useState(false);

  // ERROR HANDLDING
  const [errorResponse, setErrorResponse] = useState<string>("");
  const [isError, setIsError] = useState<boolean>(false);

  const handleAgentCardUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCurrentUrl(e.currentTarget.value);
  }
  const handleError = (e:Error) => {
    setErrorResponse(e.message);
    setIsError(true);
  }
  const handleAgentCardUrlSave = async () => {
    try {
      setAgentCardSaving(true);
      const agentCard = await a2aClient.getAgentCard(currentUrl);
      agentCard.chatboxSettingId = agentProviderId;
      agentCard.baseUrl = currentUrl;
      setBaseInfo((old) => ({...old,...agentCard}));
      setAgentCardInfo((old:any) => ({...old,...agentCard}));
      setAgentProviderSettings({
        agentUrl: currentUrl,
      })
      setIsError(false);
    }
    catch (e: any) {
      handleError(e);
    }
    finally {
      setAgentCardSaving(false);
    }
  }
  const checkAgentCardInfo = async () => {
    //TODO: BETTER HANDLE ERROR + LOG ERROR
    try {
      setAgentCardChecking(true);
      const agentCard = await a2aClient.getAgentCard(currentUrl);
      setAgentCardInfo(({
        ...agentCard
      }))
      setIsError(false);
    }
    catch (e: any) {
      console.log(e)
      handleError(e);
    }
    finally {
      setAgentCardChecking(false);
    }
    //TODO: API CALL TO GET AGENT CARD TO DISPLAY
  }

  return (
    <Stack key={baseInfo?.chatboxSettingId} gap="xxl">
      <Flex gap="xs" align="center">
        <Title order={3} c="chatbox-secondary">
          This is the title in baseInfo
        </Title>
        <PopoverConfirm
          title='Confirm to delete the agent provider'
          confirmButtonColor='chatbox-error'
          onConfirm={() => {
            setSettings(
              {
                agentProviders: settings.agentProviders?.filter((p) => p.chatboxSettingId !== baseInfo?.chatboxSettingId)
              }
            )
            //TODO: DO RESEARCH ON TANSTACK NAVIGATION
            navigate({ to: "./.." as any, replace: true });
          }}
        >
          <Button
            variant="transparent"
            size="compact-xs"
            leftSection={<IconTrash size={24} />}
            color="chatbox-error"
          ></Button>
        </PopoverConfirm>
      </Flex>

      <Stack gap="xl">
        {/* Agent Card Url */}
        <Stack gap="xxs">
          <Text span fw="600">
            {t('Agent Url')}
          </Text>
          <Flex gap="xs" align="center">
            <TextInput
              flex={1}
              value={currentUrl}
              placeholder={currentUrl}
              onChange={handleAgentCardUrlChange}
            />
            <Button
              size="sm"
              disabled={isEmpty(currentUrl)}
              loading={agentCardChecking}
              onClick={checkAgentCardInfo}
            >
              {t('Check')}
            </Button>
            <Button
              size="sm"
              disabled={isEmpty(currentUrl)}
              loading={agentCardSaving}
              onClick={handleAgentCardUrlSave}
            >
              {t('Save')}
            </Button>
          </Flex>
          {
            isError && (
              <Text span c="chatbox-error">
                {errorResponse}
              </Text>
            )
          }
          {
            !isEmpty(currentAgentCard) && !isError && (
              <JSONPretty data={currentAgentCard} theme={JSONPrettyMon}></JSONPretty>
            )
          }
        </Stack>
      </Stack>
    </Stack>
  )
}

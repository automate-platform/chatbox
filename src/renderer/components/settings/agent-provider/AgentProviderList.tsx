import { Button, Flex, Image, Indicator, Stack, Text } from '@mantine/core'
import { IconChevronRight, IconFileImport, IconPlus } from '@tabler/icons-react'
import { Link, useRouterState } from '@tanstack/react-router'
import clsx from 'clsx'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ProviderBaseInfo } from 'src/shared/types'
import CustomProviderIcon from '@/components/CustomProviderIcon'
import { useProviders } from '@/hooks/useProviders'
import { useIsSmallScreen } from '@/hooks/useScreenChange'
import { AgentCard } from 'src/shared/types'
import platform from '@/platform'
import { useAgentProviders } from '@/hooks/useAgentProviders'

// @ts-ignore - Webpack require.context
const iconContext = require.context('../../../static/icons/providers', false, /\.png$/)
const icons: { name: string; src: string }[] = iconContext.keys().map((key: string) => ({
  name: key.replace('./', '').replace('.png', ''),
  src: iconContext(key),
}))

interface AgentProviderListProps {
  agentProviders: AgentCard[]
  onAddAgentProvider: () => void
}
export function AgentProviderList({ agentProviders, onAddAgentProvider }: AgentProviderListProps) {
  const { t } = useTranslation();
  const isSmallScreen = useIsSmallScreen();
  const routerState = useRouterState();

  const agentProviderId = useMemo(() => {
    const pathSegments = routerState.location.pathname.split("/").filter(Boolean);
    const agentProviderIndex = pathSegments.indexOf("agent_provider");
    return agentProviderIndex !== -1 ? pathSegments[agentProviderIndex + 1] : undefined
  }, [routerState.location.pathname])

  const {agentProviders: agentProviderList} = useAgentProviders();
  return (
    <Stack
      className={clsx(
        'border-solid border-0 border-r border-[var(--mantine-color-chatbox-border-primary-outline)] ',
        isSmallScreen ? 'w-full border-r-0' : 'flex-[1_0_auto] max-w-[16rem]'
      )}
      gap={0}
    >
      <Stack p={isSmallScreen ? 0 : 'xs'} gap={isSmallScreen ? 0 : 'xs'} flex={1} className="overflow-auto">
        {agentProviders.map((agentProvider) => (
          <Link
            key={agentProvider.chatboxSettingId}
            to={`/settings/agent_provider/$agentProviderId`}
            params={{ agentProviderId: agentProvider.chatboxSettingId || "" }}
            className={clsx(
              'no-underline',
              isSmallScreen
                ? 'border-solid border-0 border-b border-[var(--mantine-color-chatbox-border-primary-outline)]'
                : ''
            )}
          >
            <Flex
              component="span"
              align="center"
              gap="xs"
              p="md"
              pr="xl"
              py={isSmallScreen ? 'sm' : undefined}
              c={agentProvider.chatboxSettingId === agentProviderId ? 'chatbox-brand' : 'chatbox-secondary'}
              bg={agentProvider.chatboxSettingId === agentProviderId ? 'var(--mantine-color-chatbox-brand-light)' : 'transparent'}
              className="cursor-pointer select-none rounded-md hover:!bg-[var(--mantine-color-chatbox-brand-outline-hover)]"
            >

              {/* TODO ADD ICON HERE */}
              {/* <CustomProviderIcon providerId={provider.id} providerName={provider.name} size={36} /> */}

              <Text
                span
                size="sm"
                flex={isSmallScreen ? 1 : undefined}
                className="!text-inherit whitespace-nowrap overflow-hidden text-ellipsis"
              >
                {/* change this to chat box agent provider name */}
                {agentProvider.name}
              </Text>

              {!!agentProviderList.find((p) => p.id === agentProvider.chatboxSettingId) && (
                <Indicator
                  size={8}
                  color="chatbox-success"
                  className="ml-auto"
                  disabled={!agentProviderList.find((p) => p.id === agentProvider.chatboxSettingId)}
                />
              )}

              {isSmallScreen && (
                <IconChevronRight size={20} className="!text-[var(--mantine-color-chatbox-tertiary-outline)] ml-2" />
              )}
            </Flex>
          </Link>
        ))}
      </Stack>
      <Stack gap="xs" mx="md" my="sm">
        <Button variant="outline" leftSection={<IconPlus size={16} />} onClick={() => { console.log("OPENED", onAddAgentProvider), onAddAgentProvider()}}>
          {t('Add New Agent')}
        </Button>
        {/* TODO: ADD BUTTON FOR IMPORT */}
      </Stack>
    </Stack>
  )
}
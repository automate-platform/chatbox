import { Badge, Button, Combobox, type ComboboxProps, Drawer, Flex, Stack, Text, useCombobox } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconStar, IconStarFilled } from '@tabler/icons-react'
import { useNavigate } from '@tanstack/react-router'
import clsx from 'clsx'
import {
  cloneElement,
  forwardRef,
  isValidElement,
  type MouseEvent,
  type PropsWithChildren,
  type ReactElement,
  useMemo,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import type { AgentCard, ModelProvider, ProviderBaseInfo, ProviderModelInfo } from 'src/shared/types'
import { useProviders } from '@/hooks/useProviders'
import { useIsSmallScreen } from '@/hooks/useScreenChange'
import ProviderIcon from './icons/ProviderIcon'
import { useAgentProviders } from '@/hooks/useAgentProviders'

export type ModelSelectorProps = PropsWithChildren<
  {
    showAuto?: boolean
    autoText?: string
    onSelect?: (provider: ModelProvider | string, model: string) => void
    onDropdownOpen?: () => void
    modelFilter?: (model: ProviderModelInfo) => boolean
  } & ComboboxProps
>
export type AgentSelectorProps = PropsWithChildren<
  {
    showAuto?: boolean
    autoText?: string,
    onSelect?: (agentProviderId: string) => void
    onDropdownOpen?: () => void
  } & ComboboxProps
>


export const AgentProviderSelector = forwardRef<HTMLDivElement, AgentSelectorProps>(
  ({ showAuto, autoText, onSelect, onDropdownOpen, children, ...comboboxProp }, ref) => {
    const { t } = useTranslation()
    const navigate = useNavigate();
    const { agentProviders } = useAgentProviders();

    const [search, setSearch] = useState('');

    const filteredAgentProviders = [...agentProviders] //TODO: ADD LOGIC FOR FILTER
    const isEmpty = filteredAgentProviders.length === 0;
    const combobox = useCombobox({
      onDropdownClose: () => {
        combobox.resetSelectedOption()
        combobox.focusTarget()
        setSearch('')
      },

      onDropdownOpen: () => {
        // combobox.focusSearchInput()
        onDropdownOpen?.()
      },
    })
    const options = filteredAgentProviders.map(item => {
      return (
        <AgentProviderItem
          agentProviderId={item.chatboxSettingId || ""}
          agentCard={item}
          key={item.chatboxSettingId}
        >
        </AgentProviderItem>
      )
    })
    // val is the provider id
    const handleOptionSubmit = (val: string) => {
      if (!val) {
        onSelect?.('');
        return;
      }
      const selectedAgentProvider = agentProviders.find((ap) => {
        return ap.chatboxSettingId === val;
      })
      if (selectedAgentProvider && selectedAgentProvider.chatboxSettingId) {
        console.log("AGENT SELECTED");
        onSelect?.(selectedAgentProvider.chatboxSettingId);
      }
      console.log("Selected Agent", selectedAgentProvider);
      combobox.closeDropdown()
    }
    const isSmallScreen = useIsSmallScreen()
    const [opened, { open, close }] = useDisclosure(false)
    if (isSmallScreen) {
      return (
        <>
          {isValidElement(children) ? (
            cloneElement(children as ReactElement, {
              onClick: (e: MouseEvent<HTMLButtonElement, MouseEvent>) => {
                children.props?.onClick?.(e)
                open()
              },
              ref,
            })
          ) : (
            <button onClick={open} className="border-none bg-transparent p-0 flex">
              {children}
            </button>
          )}

          <Drawer
            opened={opened}
            onClose={close}
            position="bottom"
            title={t('Select Model')}
            classNames={{
              header: '!p-sm !min-h-0',
              body: '!px-xs',
              content: '!rounded-tl-lg !rounded-tr-lg',
            }}
            // className=' min-h-0'
            styles={{
              title: {
                flex: 1,
                marginLeft: 28,
                textAlign: 'center',
                fontWeight: 600,
              },
            }}
            size="80%"
            zIndex={3000}
            trapFocus={false}
          >
            <Stack gap="md">
              {showAuto && (
                <Flex
                  component="button"
                  align="center"
                  gap="xs"
                  px="md"
                  py="sm"
                  className="rounded-md border-solid border border-[var(--mantine-color-chatbox-border-secondary-outline)] outline-none bg-transparent"
                  onClick={() => {
                    handleOptionSubmit('')
                    close()
                  }}
                >
                  <Text span size="md" c="chatbox-secondary" lineClamp={1} className="flex-grow-0 flex-shrink text-left">
                    {autoText || t('Auto')}
                  </Text>
                </Flex>
              )}
              {
                agentProviders.map(item => {
                  return (
                    <Stack>
                      <AgentProviderItemInDrawer
                        agentProviderId={item.chatboxSettingId || ""}
                        agentCard={item}
                      >

                      </AgentProviderItemInDrawer>
                    </Stack>
                  )
                })
              }
            </Stack>
          </Drawer>
        </>
      )
    }
    return (
      <>
        <Combobox
        store={combobox}
        width={260}
        position="top"
        withinPortal={true}
        {...comboboxProp}
        onOptionSubmit={handleOptionSubmit}
      >
        <Combobox.Target targetType="button">
          {isValidElement(children) ? (
            cloneElement(children as ReactElement, {
              onClick: (e: MouseEvent<HTMLButtonElement, MouseEvent>) => {
                children.props?.onClick?.(e)
                combobox.toggleDropdown()
              },
              ref,
            })
          ) : (
            <button onClick={() => combobox.toggleDropdown()} className="border-none bg-transparent p-0 flex">
              {children}
            </button>
          )}
        </Combobox.Target>

        <Combobox.Dropdown>
          {/* TODO: ADD FILTER LOGIC */}
          {/* <Combobox.Search
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder={t('Search agent provider')!}
          /> */}
          <Combobox.Options mah="50vh" style={{ overflowY: 'auto' }}>
            {showAuto && (
              <Combobox.Option value={''} c="chatbox-primary">
                {autoText || t('Auto')}
              </Combobox.Option>
            )}
            {isEmpty && !showAuto ? (
              <Stack gap="xs" pt="xs" align="center" className="overflow-hidden">
                <Text c="chatbox-tertiary" size="xs">
                  {t('No eligible agent provider available')}
                </Text>
                <Button variant="transparent" size="xs" onClick={() => navigate({ to: '/settings/agent_provider' })}>
                  {t('Click here to set up')}
                </Button>
              </Stack>
            ) : (
              <>
                {options}
              </>
            )}
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
      </>
    )
  }
)
export default AgentProviderSelector


const AgentProviderItem = ({
  agentProviderId,
  agentCard
}: {
  agentProviderId: string
  agentCard: AgentCard
}) => {
  return (
    <>
      <Combobox.Option value={`${agentProviderId}`} className="flex flex-row items-center group">
        {/* {showIcon && <ProviderIcon size={12} provider={providerId} className="mr-xs flex-shrink-0" />} */}
        {/* TODO: ADD ICON */}
        <Text
          span
          className="flex-shrink"
          c={'chatbox-primary'}
        >
          {agentCard.name}
        </Text>
      </Combobox.Option>
    </>
  )
}
const AgentProviderItemInDrawer = ({
  agentProviderId,
  agentCard,
  onSelect,
}: {
  agentProviderId: string,
  agentCard: AgentCard,
  onSelect?(): void,
}) => {
  return (
    <Flex
      component="button"
      key={agentProviderId}
      align="center"
      gap="xs"
      px="md"
      py="sm"
      c={'chatbox-secondary'}
      className="border-solid border border-[var(--mantine-color-chatbox-border-secondary-outline)] outline-none bg-transparent rounded-md"
      onClick={() => {
        onSelect?.()
      }}
    >
      {/* TODO: ADD ICON */}
      <Text span size="md" className="flex-grow-0 flex-shrink text-left overflow-hidden break-words !text-inherit">
        {agentCard.name}
      </Text>
      <Flex
        component="span"
        className={clsx(
          'ml-auto -m-xs p-xs',
          'text-[var(--mantine-color-chatbox-border-secondary-outline)]'
        )}
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
      </Flex>
    </Flex>
  )
}
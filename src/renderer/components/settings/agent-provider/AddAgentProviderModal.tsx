import { Button, Flex, Modal, Select, Stack, Text, TextInput } from '@mantine/core'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AgentCard, ModelProviderType } from 'src/shared/types'
import { v4 as uuidv4 } from 'uuid'
import { useSettings } from '@/hooks/useSettings'

interface AgentProviderModalProps {
  opened: boolean
  onClose: () => void
}

export function AddAgentProviderModal({ opened, onClose }: AgentProviderModalProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { settings, setSettings } = useSettings()

  const [newAgentName, setNewAgentName] = useState("");
  const [newProviderName, setNewProviderName] = useState('');

  const handleAddAgentProvider = () => {
    const pid = `custom-agent-provider-${uuidv4()}`;

    //TODO: SINCE THIS ADD NEW AGENT CARD ALREADY, NEED TO CHECK IF THE BASEURL EXIST
    setSettings({
      agentProviders: [
        ...(settings.agentProviders || []),
        {
          chatboxSettingId: pid,
          name: newAgentName
        }
      ]
    })
    onClose();
    navigate({
      to: '/settings/agent_provider/$agentProviderId',
      params: {
        agentProviderId: pid
      }
    })
  }

  return (
    <Modal size="sm" opened={opened} onClose={onClose} centered title={t('Add provider')}>
      <Stack gap="xs">
        <Text>{t('Name')}</Text>
        <TextInput
          value={newAgentName}
          onChange={(e) => setNewAgentName(e.currentTarget.value)}
          required
          error={!newAgentName.trim() ? t('Name is required') : ''}
        />
        {/* <Text>{t('API Mode')}</Text>
        <Select
          value={newProviderMode}
          data={[
            {
              value: ModelProviderType.OpenAI,
              label: t('OpenAI API Compatible'),
            },
          ]}
        /> */}
        <Flex justify="flex-end" gap="sm" mt="sm">
          <Button variant="light" color="chatbox-gray" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button onClick={handleAddAgentProvider} disabled={!newAgentName.trim()}>
            {t('Add')}
          </Button>
        </Flex>
      </Stack>
    </Modal>
  )
}

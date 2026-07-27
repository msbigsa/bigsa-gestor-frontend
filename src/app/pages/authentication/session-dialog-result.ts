export const SESSION_ACTIONS = {
  REFRESH: 'refresh',
  EXPIRED: 'expired'
} as const;

export type SessionDialogResult =
  typeof SESSION_ACTIONS[keyof typeof SESSION_ACTIONS];
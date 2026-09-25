export const PARTICIPANTS_CHANGED_EVENT = 'barokah:participants-changed'

export function notifyParticipantsChanged() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(PARTICIPANTS_CHANGED_EVENT))
}
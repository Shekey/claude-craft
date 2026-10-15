export type Channel = { id: "email" | "push" | "sms"; label: string; enabled: boolean };

export async function getChannels(): Promise<Channel[]> {
  const response = await fetch("/api/notification-channels");
  if (!response.ok) throw new Error(`Channels failed: ${response.status}`);
  return response.json();
}

export async function setChannelEnabled(id: Channel["id"], enabled: boolean): Promise<void> {
  const response = await fetch(`/api/notification-channels/${id}`, { method: "PATCH", body: JSON.stringify({ enabled }) });
  if (!response.ok) throw new Error(`Update failed: ${response.status}`);
}

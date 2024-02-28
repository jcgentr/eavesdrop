export async function getBroadcastingClients() {
  try {
    const response = await fetch("/clients");
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    return data.clientsBroadcasting;
  } catch (error) {
    console.error("Error fetching client data:", error);
    return [];
  }
}

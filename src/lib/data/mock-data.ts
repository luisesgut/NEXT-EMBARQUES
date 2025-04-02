// Datos de muestra para el producto
export const mockProduct = {
  id: "#4661",
  name: "LOGÍSTICA #4661",
  description: "CLIENTE: SCHETTINO HERMANOS",
  rfidTag: "RFID-9876543210",
  sku: "PT05586",
  batchNumber: "BATCH-2025-03-15",
  manufacturingDate: "2025-02-10",
  expiryDate: "2027-02-10",
  quantity: 24,
  totalQuantity: 24,
  loadedQuantity: 16,
  unitType: "Cajas",
  weight: "450kg",
  dimensions: "80cm x 60cm x 40cm",
  volume: "0.192m³",
  category: "POUCH",
  subcategory: "PRODUCTO TERMINADO",
  status: "loading", // loading, completed, error
  priority: "Alta",
  temperature: "18-25°C",
  humidity: "30-50%",
  specialHandling: "Frágil, Sensible",
  certifications: ["ISO 9001", "RoHS", "CE"],
  supplier: {
    name: "BFX EMPAQUES FLEXIBLES",
    id: "SUP-12345",
    contact: "+1 555-123-4567"
  },
  destination: {
    name: "Centro de Distribución Norte",
    address: "Av. Industrial 1234, Zona Norte",
    coordinates: "41.40338, 2.17403"
  },
  truckInfo: {
    id: "TRK-12345",
    driver: "Carlos Rodríguez",
    plate: "ABC-1234",
    dockNumber: 3
  },
  trackingHistory: [
    { timestamp: "2025-03-07T10:15:30", event: "Recibido en almacén", location: "Almacén Central" },
    { timestamp: "2025-03-07T11:45:22", event: "Inspección de calidad", location: "Área de Control" },
    { timestamp: "2025-03-07T13:20:15", event: "Preparado para embarque", location: "Zona de Preparación" },
    { timestamp: "2025-03-07T14:32:10", event: "Detectado por RFID", location: "Entrada Andén 3" },
    { timestamp: "2025-03-07T14:33:45", event: "Verificado", location: "Punto de Control" },
    { timestamp: "2025-03-07T14:35:20", event: "En proceso de carga", location: "Andén 3" }
  ],
  scanHistory: [
    { time: "14:32:10", status: "detected", location: "Entrada Andén 3" },
    { time: "14:33:45", status: "verified", location: "Punto de Control" },
    { time: "14:35:20", status: "loading", location: "Andén 3" }
  ],
  lastScan: "2025-03-07T14:35:20",
  estimatedCompletion: "2025-03-07T15:00:00",
  loadingProgress: 65,
  images: [
    "/placeholder.svg?height=600&width=800",
    "/placeholder.svg?height=600&width=800",
    "/placeholder.svg?height=600&width=800"
  ]
}
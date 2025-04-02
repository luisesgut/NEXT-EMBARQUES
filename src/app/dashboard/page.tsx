"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Truck, Package, BarChart, Clock, CheckCircle2, AlertCircle, Wifi, ArrowRight, LineChart, Boxes, Clipboard, ArrowUpRight, FileCheck, CircleAlert, Inbox, ArrowLeft } from 'lucide-react'
import { io } from "socket.io-client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"

import { mockProduct } from "@/lib/data/mock-data"

// URL del backend
const BACKEND_URL = 'http://localhost:3000';
type CarrilKey = 'reader1' | 'reader2' | 'reader3'

export default function Dashboard() {
  const [product, setProduct] = useState(mockProduct)
  const [rfidSignal, setRfidSignal] = useState(4) // 0-4 signal strength
 
const [selectedCarril, setSelectedCarril] = useState<CarrilKey | null>(null)


  
  // Estados para los lectores RFID
  const [readers, setReaders] = useState<{
    reader1: {
      status: string;
      isReading: boolean;
      lastUpdate: Date | null;
      logisticId?: string;
    };
    reader2: {
      status: string;
      isReading: boolean;
      lastUpdate: Date | null;
      logisticId?: string;
    };
    reader3: {
      status: string;
      isReading: boolean;
      lastUpdate: Date | null;
      logisticId?: string;
    };
  }>({
    reader1: {
      status: 'unknown',
      isReading: false,
      lastUpdate: null
    },
    reader2: {
      status: 'unknown',
      isReading: false,
      lastUpdate: null
    },
    reader3: {
      status: 'unknown',
      isReading: false,
      lastUpdate: null
    }
  });

  // Estado para los EPCs detectados
  type EpcItem = {
    epc: string;
    timestamp: Date;
    info?: any;
  };
  
  const [validEpcs, setValidEpcs] = useState<EpcItem[]>([]);
  const [invalidEpcs, setInvalidEpcs] = useState<EpcItem[]>([]);

  //objeto de pruebas 
  const products: Record<string, typeof mockProduct> = {
    "LOG123": mockProduct,
    "LOG456": {
      ...mockProduct,
      name: "Producto 2",
      rfidTag: "EPC456789ABCDEF",
      status: "loading"
    }
  }
  

  // Socket.io connection
  useEffect(() => {
    // Conectar al servidor Socket.io
    const socket = io(BACKEND_URL);
    
    socket.on('connect', () => {
      console.log('Conectado al servidor WebSocket - ID:', socket.id);
      setRfidSignal(4); // Señal fuerte cuando conectado
    });
    
    socket.on('disconnect', () => {
      console.log('Desconectado del servidor WebSocket');
      setRfidSignal(0); // Sin señal cuando desconectado
    });
    
    // Listeners genéricos para depuración
    socket.onAny((event, ...args) => {
      console.log(`[DEBUG] Evento recibido: ${event}`, args);
    });
    
    // Eventos para el lector 1
    socket.on(`lector/reader1/status`, (data: any) => {
      console.log('Status lector 1:', data);
      setReaders(prev => ({
        ...prev,
        reader1: {
          status: data.status || prev.reader1.status,
          isReading: data.status === 'running',
          lastUpdate: new Date()
        }
      }));
    });
    
    // Eventos para el lector 2
    socket.on(`lector/reader2/status`, (data: any) => {
      console.log('Status lector 2:', data);
      setReaders(prev => ({
        ...prev,
        reader2: {
          status: data.status || prev.reader2.status,
          isReading: data.status === 'running',
          lastUpdate: new Date()
        }
      }));
    });
    
    // Eventos para el lector 3
    socket.on(`lector/reader3/status`, (data: any) => {
      console.log('Status lector 3:', data);
      setReaders(prev => ({
        ...prev,
        reader3: {
          status: data.status || prev.reader3.status,
          isReading: data.status === 'running',
          lastUpdate: new Date()
        }
      }));
    });
    
    // Detección de EPCs válidos (formato antiguo)
    socket.on('epcDetectado', (info: any) => {
      console.log('EPC válido detectado (formato antiguo):', info);
      
      // Extraer el EPC (puede estar en diferentes campos)
      const epc = info.rfid || info.epc || info.tag || info.id;
      
      if (epc) {
        // Agregar a la lista si no existe
        setValidEpcs(prev => {
          if (!prev.some(item => item.epc === epc)) {
            return [{
              epc: epc,
              timestamp: new Date(),
              info: info
            }, ...prev];
          }
          return prev;
        });
        
        // Actualizar el producto actual si el EPC coincide
        if (epc === product.rfidTag) {
          setProduct(prev => ({
            ...prev,
            lastScan: new Date().toISOString(),
            loadingProgress: Math.min(100, prev.loadingProgress + 5),
            scanHistory: [
              {
                time: new Date().toLocaleTimeString(),
                status: "verified",
                location: `Andén ${prev.truckInfo.dockNumber}`
              },
              ...prev.scanHistory
            ].slice(0, 10) // Mantener solo los últimos 10 escaneos
          }));
        }
      } else {
        console.warn('Formato de EPC válido no reconocido:', info);
      }
    });
    
    // Detección de EPCs inválidos (formato antiguo)
    socket.on('epcNoIdentificado', (data: any) => {
      console.log('EPC inválido detectado (formato antiguo):', data);
      
      // Extraer el EPC (puede estar en diferentes campos)
      const epc = data.epc || data.rfid || data.tag || data.id;
      
      if (epc) {
        // Agregar a la lista si no existe
        setInvalidEpcs(prev => {
          if (!prev.some(item => item.epc === epc)) {
            return [{
              epc: epc,
              timestamp: new Date(),
              info: data
            }, ...prev];
          }
          return prev;
        });
      } else {
        console.warn('Formato de EPC inválido no reconocido:', data);
      }
    });
    
    // Eventos de inventario directo (cualquier formato)
    socket.on('rfidTagDetected', (data: any) => {
      console.log('RFID Tag detectado:', data);
      
      // Extraer el EPC (puede estar en diferentes campos)
      const epc = data.epc || data.rfid || data.tag || data.id;
      const isValid = data.valid !== false; // Asumir válido a menos que se indique lo contrario
      
      if (epc) {
        if (isValid) {
          // EPC válido
          setValidEpcs(prev => {
            if (!prev.some(item => item.epc === epc)) {
              return [{
                epc: epc,
                timestamp: new Date(),
                info: data
              }, ...prev];
            }
            return prev;
          });
        } else {
          // EPC inválido
          setInvalidEpcs(prev => {
            if (!prev.some(item => item.epc === epc)) {
              return [{
                epc: epc,
                timestamp: new Date(),
                info: data
              }, ...prev];
            }
            return prev;
          });
        }
      }
    });
    
    // Eventos MQTT para el lector 1
    socket.on(`readers/reader1/inventory`, (data: any) => {
      console.log('Inventory reader 1:', data);
      processInventoryData(data);
    });
    
    // Eventos MQTT para el lector 2
    socket.on(`readers/reader2/inventory`, (data: any) => {
      console.log('Inventory reader 2:', data);
      processInventoryData(data);
    });
    
    // Eventos MQTT para el lector 3
    socket.on(`readers/reader3/inventory`, (data: any) => {
      console.log('Inventory reader 3:', data);
      processInventoryData(data);
    });
    
    // Nuevos eventos para posibles diferentes formatos
    socket.on(`inventory`, (data: any) => {
      console.log('Evento inventory general:', data);
      processInventoryData(data);
    });
    
    socket.on(`tag`, (data: any) => {
      console.log('Evento tag:', data);
      processInventoryData(data);
    });
    
    // Función auxiliar para procesar datos de inventario en cualquier formato
    const processInventoryData = (data: any) => {
      // Si es un arreglo, procesar cada elemento
      if (Array.isArray(data)) {
        data.forEach(item => processInventoryItem(item));
        return;
      }
      
      // Si es un objeto, procesarlo directamente
      processInventoryItem(data);
    };
    
    const processInventoryItem = (data: any) => {
      // Verificar si es formato MQTT estándar
      if (data.type === 'epc_read' && data.epc) {
        const isValid = data.valid === true;
        
        if (isValid) {
          // EPC válido
          setValidEpcs(prev => {
            if (!prev.some(item => item.epc === data.epc)) {
              return [{
                epc: data.epc,
                timestamp: new Date(),
                info: data
              }, ...prev];
            }
            return prev;
          });
        } else {
          // EPC inválido
          setInvalidEpcs(prev => {
            if (!prev.some(item => item.epc === data.epc)) {
              return [{
                epc: data.epc,
                timestamp: new Date(),
                info: data
              }, ...prev];
            }
            return prev;
          });
        }
        return;
      }
      
      // Verificar otros formatos posibles
      const epc = data.epc || data.rfid || data.tag || data.id;
      if (!epc) {
        console.warn('No se pudo extraer EPC de:', data);
        return;
      }
      
      // Determinar si es válido (a menos que se indique lo contrario)
      const isValid = data.valid !== false && data.status !== 'invalid';
      
      if (isValid) {
        // EPC válido
        setValidEpcs(prev => {
          if (!prev.some(item => item.epc === epc)) {
            return [{
              epc: epc,
              timestamp: new Date(),
              info: data
            }, ...prev];
          }
          return prev;
        });
      } else {
        // EPC inválido
        setInvalidEpcs(prev => {
          if (!prev.some(item => item.epc === epc)) {
            return [{
              epc: epc,
              timestamp: new Date(),
              info: data
            }, ...prev];
          }
          return prev;
        });
      }
    };
    
    // Cleanup al desmontar
    return () => {
      socket.disconnect();
    };
  }, [product.rfidTag]);
  
  // Funciones para controlar los lectores
  const startReading = async (lectorId = 'reader1') => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/lector/iniciar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ lectorId, perfil: 'TEST' })
      });
      
      const data = await response.json();
      console.log('Respuesta iniciar lectura:', data);
    } catch (error) {
      console.error('Error al iniciar lectura:', error);
    }
  };
  
  const stopReading = async (lectorId = 'reader1') => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/lector/detener`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ lectorId })
      });
      
      const data = await response.json();
      console.log('Respuesta detener lectura:', data);
    } catch (error) {
      console.error('Error al detener lectura:', error);
    }
  };
  
  // Iniciar polling de status
  const startPolling = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/lector/iniciarPolling`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('Respuesta iniciar polling:', data);
    } catch (error) {
      console.error('Error al iniciar polling:', error);
    }
  };
  
  // Renderizar indicador de señal RFID
  const renderRfidSignal = () => {
    const signals = []
    for (let i = 0; i < 5; i++) {
      signals.push(
        <div 
          key={i} 
          className={`h-${i+1} w-1 mx-[1px] rounded-sm ${i < rfidSignal ? 'bg-primary' : 'bg-muted'}`}
        />
      )
    }
    return (
      <div className="flex items-end">
        {signals}
      </div>
    )
  }
  
  // Renderizar estado del producto
  const renderStatus = (status: string) => {
    switch(status) {
      case "loading":
        return (
          <Badge className="bg-amber-500 text-white px-3 py-1.5 font-medium flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
            En Carga
          </Badge>
        )
      case "completed":
        return (
          <Badge className="bg-green-500 text-white px-3 py-1.5 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Completado
          </Badge>
        )
      case "error":
        return (
          <Badge className="bg-red-500 text-white px-3 py-1.5 font-medium flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            Error
          </Badge>
        )
      default:
        return <Badge className="px-3 py-1.5 font-medium">Desconocido</Badge>
    }
  }
  
  // Renderizar estado del lector
  const renderReaderStatus = (reader: {
    status: string;
    isReading: boolean;
    lastUpdate: Date | null;
  }) => {
    if (reader.status === 'running') {
      return (
        <Badge className="bg-green-500 text-white px-3 py-1 font-medium flex items-center gap-1.5">
          <div className="relative w-3 h-3">
            <div className="absolute inset-0 bg-white rounded-full opacity-50 animate-ping"></div>
            <div className="relative w-3 h-3 bg-white rounded-full"></div>
          </div>
          Leyendo
        </Badge>
      );
    } else if (reader.status === 'idle') {
      return (
        <Badge className="bg-blue-500 text-white px-3 py-1 font-medium flex items-center gap-1.5">
          <div className="w-3 h-3 bg-white rounded-full"></div>
          Conectado
        </Badge>
      );
    } else if (reader.status === 'ERROR') {
      return (
        <Badge className="bg-red-500 text-white px-3 py-1 font-medium flex items-center gap-1.5">
          <AlertCircle className="h-3 w-3" />
          Error
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gray-500 text-white px-3 py-1 font-medium flex items-center gap-1.5">
          <div className="w-3 h-3 border-2 border-white rounded-full"></div>
          Desconocido
        </Badge>
      );
    }
  };
  
  // Iniciar polling al cargar la página
  useEffect(() => {
    startPolling();
  }, []);
  
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 shadow-lg sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/90 text-blue-700 p-2 rounded-full">
              <Truck className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Sistema de Embarque RFID</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-blue-800/50 py-1.5 px-3 rounded-full">
              <Wifi className="h-5 w-5" />
              {renderRfidSignal()}
            </div>
            <Badge variant="outline" className="bg-white/90 text-blue-700 border-0 py-1.5">
              <span className="font-semibold">Andén {product.truckInfo.dockNumber}</span>
            </Badge>
            <Link href="/tv-display">
              <Button variant="outline" size="sm" className="bg-white/90 text-blue-700 border-0 hover:bg-white">
                <span className="flex items-center gap-2">
                  Ver Pantalla TV
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 container mx-auto p-5 md:p-6">
        {/* Dashboard Overview - Primera fila */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 mb-6">
          {/* Tarjetas de resumen */}
          <Card className="bg-gradient-to-br from-white to-blue-50 border-0 shadow-md dark:from-slate-800 dark:to-slate-900">
            <CardContent className="p-6">
              <div className="flex justify-between">
                <div className="space-y-3">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Tags detectados</span>
                  <div className="text-3xl font-bold text-slate-800 dark:text-white">{validEpcs.length}</div>
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                    <ArrowUpRight className="h-3 w-3" /> 
                    +{Math.floor(Math.random() * 8) + 1} en la última hora
                  </span>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-3 rounded-full h-fit">
                  <FileCheck className="h-7 w-7" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-white to-red-50 border-0 shadow-md dark:from-slate-800 dark:to-slate-900">
            <CardContent className="p-6">
              <div className="flex justify-between">
                <div className="space-y-3">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Tags no autorizados</span>
                  <div className="text-3xl font-bold text-slate-800 dark:text-white">{invalidEpcs.length}</div>
                  <span className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                    <ArrowUpRight className="h-3 w-3" /> 
                    +{Math.floor(Math.random() * 3)} en la última hora
                  </span>
                </div>
                <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-full h-fit">
                  <CircleAlert className="h-7 w-7" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-white to-green-50 border-0 shadow-md dark:from-slate-800 dark:to-slate-900">
            <CardContent className="p-6">
              <div className="flex justify-between">
                <div className="space-y-3">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Progreso embarque</span>
                  <div className="text-3xl font-bold text-slate-800 dark:text-white">{product.loadingProgress}%</div>
                  <Progress 
                    value={product.loadingProgress} 
                    className="h-2 bg-slate-100 dark:bg-slate-700 w-24" 
                    indicatorClassName={product.loadingProgress === 100 
                      ? "bg-gradient-to-r from-green-500 to-green-400" 
                      : "bg-gradient-to-r from-blue-600 to-blue-400"}
                  />
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-3 rounded-full h-fit">
                  <Boxes className="h-7 w-7" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-white to-indigo-50 border-0 shadow-md dark:from-slate-800 dark:to-slate-900">
            <CardContent className="p-6">
              <div className="flex justify-between">
                <div className="space-y-3">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Tiempo estimado</span>
                  <div className="text-3xl font-bold text-slate-800 dark:text-white">12:45</div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" /> 
                    Actualizado a las {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 p-3 rounded-full h-fit">
                  <Clock className="h-7 w-7" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
       {/* Producto actual y Lectores RFID */}
{/* Producto actual y Lectores RFID */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
  {/* Producto Actual */}
  <Card className="lg:col-span-2 border-0 shadow-lg overflow-hidden">
    <CardHeader className="pb-2 bg-slate-50 dark:bg-slate-800 border-b">
      <div className="flex justify-between items-center">
        <div>
          <CardTitle className="text-2xl text-blue-700 dark:text-blue-400">
            {selectedCarril && readers[selectedCarril]?.logisticId 
              ? products[readers[selectedCarril].logisticId]?.name || product.name
              : product.name}
          </CardTitle>
          <CardDescription className="text-slate-500">
            <span className="inline-flex items-center gap-2">
              <Package className="h-4 w-4" /> 
              ID: {selectedCarril && readers[selectedCarril]?.logisticId 
                ? readers[selectedCarril].logisticId || product.id
                : product.id} 
              • Tag RFID: <span className="font-mono">
                {selectedCarril && readers[selectedCarril]?.logisticId 
                  ? products[readers[selectedCarril].logisticId]?.rfidTag || product.rfidTag
                  : product.rfidTag}
              </span>
            </span>
          </CardDescription>
        </div>
        <div>
          {selectedCarril && !readers[selectedCarril]?.logisticId 
            ? <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                Carril sin logística asignada
              </Badge>
            : renderStatus(
                selectedCarril && readers[selectedCarril]?.logisticId 
                  ? products[readers[selectedCarril].logisticId]?.status || product.status
                  : product.status
              )}
        </div>
      </div>
    </CardHeader>
    <CardContent className="p-5">
      {selectedCarril && !readers[selectedCarril]?.logisticId ? (
        // Vista para carril sin logística asignada
        <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
          <div className="h-16 w-16 bg-amber-100 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400 rounded-full flex items-center justify-center">
            <Inbox className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">
              Carril {selectedCarril.replace('reader', '')} sin logística asignada
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">
              Este carril actualmente no está procesando ninguna logística. Puedes iniciar una operación asignando una logística a este carril.
            </p>
            <Button 
              className="mt-4 bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => setSelectedCarril(null)} // Vuelve a la vista principal
            >
              Ver logística principal
            </Button>
          </div>
        </div>
      ) : (
        // Vista normal de logística
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-5">
            <div className="aspect-video relative rounded-xl overflow-hidden border shadow-inner bg-white dark:bg-slate-950/50">
            <Image 
  src={
    selectedCarril &&
    readers[selectedCarril]?.logisticId &&
    products[readers[selectedCarril].logisticId]?.images?.[0]
      ? products[readers[selectedCarril].logisticId].images[0]
      : "https://bioflex.mx/wp-content/uploads/2024/03/standup_pouch.png"
  }
  alt="Imagen del producto" 
  fill
  className="object-contain p-3"
/>

            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <span className="inline-block w-1 h-5 bg-blue-500 rounded-full"></span>
                Descripción
              </h3>
              <p className="text-slate-600 dark:text-slate-400 pl-3 border-l-2 border-blue-100 dark:border-blue-900">
                {selectedCarril && readers[selectedCarril]?.logisticId 
                  ? products[readers[selectedCarril].logisticId]?.description || product.description
                  : product.description}
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 shadow-sm">
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Cantidad</p>
                <p className="text-2xl font-bold text-slate-700 dark:text-white">
                  {selectedCarril && readers[selectedCarril]?.logisticId 
                    ? products[readers[selectedCarril].logisticId]?.quantity || product.quantity
                    : product.quantity} 
                  <span className="text-sm font-normal text-slate-500">unidades</span>
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-4 shadow-sm">
                <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">Peso</p>
                <p className="text-2xl font-bold text-slate-700 dark:text-white">
                  {selectedCarril && readers[selectedCarril]?.logisticId 
                    ? products[readers[selectedCarril].logisticId]?.weight || product.weight
                    : product.weight}
                </p>
              </div>
            </div>
            
            <div className="bg-amber-50 dark:bg-amber-900/30 rounded-xl p-4 shadow-sm">
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mb-1">Destino</p>
              <p className="text-xl font-bold text-slate-700 dark:text-white flex items-center gap-2">
                <Truck className="h-4 w-4 text-amber-500" />
                {selectedCarril && readers[selectedCarril]?.logisticId 
                  ? products[readers[selectedCarril].logisticId]?.destination?.name || product.destination.name
                  : product.destination.name}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {selectedCarril && readers[selectedCarril]?.logisticId 
                  ? products[readers[selectedCarril].logisticId]?.destination?.address || product.destination.address
                  : product.destination.address}
              </p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-slate-700 dark:text-slate-300">Progreso de Carga</h3>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {selectedCarril && readers[selectedCarril]?.logisticId 
                    ? products[readers[selectedCarril].logisticId]?.loadingProgress || product.loadingProgress
                    : product.loadingProgress}%
                </span>
              </div>
              <Progress 
                value={selectedCarril && readers[selectedCarril]?.logisticId 
                  ? products[readers[selectedCarril].logisticId]?.loadingProgress || product.loadingProgress
                  : product.loadingProgress} 
                className="h-3 bg-slate-100 dark:bg-slate-700" 
                indicatorClassName={(selectedCarril && readers[selectedCarril]?.logisticId 
                  ? products[readers[selectedCarril].logisticId]?.loadingProgress || product.loadingProgress
                  : product.loadingProgress) === 100 
                  ? "bg-gradient-to-r from-green-500 to-green-400" 
                  : "bg-gradient-to-r from-blue-600 to-blue-400"}
              />
              
              <div className="flex justify-between items-center mt-3 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span>Actualizado: {new Date(
                    selectedCarril && readers[selectedCarril]?.logisticId 
                      ? products[readers[selectedCarril].logisticId]?.lastScan || product.lastScan
                      : product.lastScan
                  ).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30">
                  Detalles
                </Button>
              </div>
            </div>
            
            {selectedCarril && readers[selectedCarril]?.logisticId && (
              <div className="flex justify-end">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-slate-300 text-slate-700 hover:bg-slate-100"
                  onClick={() => setSelectedCarril(null)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a logística principal
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Nueva sección de resumen de estado de carriles */}
      <div className="mt-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <h3 className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-3">
          <span className="inline-block w-1 h-5 bg-blue-500 rounded-full"></span>
          Estado de Carriles RFID
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Carril 1 */}
          <div 
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow 
              ${selectedCarril === 'reader1' ? 'ring-2 ring-blue-400 dark:ring-blue-600' : ''}
              ${readers.reader1.status === 'running' 
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900' 
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
            onClick={() => setSelectedCarril('reader1')}
          >
            <div className={`h-8 w-8 rounded-full flex items-center justify-center 
              ${readers.reader1.status === 'running' 
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
              <div className="relative">
                {readers.reader1.status === 'running' && (
                  <div className="absolute inset-0 rounded-full animate-ping bg-blue-500 opacity-30 h-5 w-5"></div>
                )}
                <Wifi className="h-4 w-4 z-10 relative" />
              </div>
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">
                Carril 1
                <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs uppercase 
                  ${readers.reader1.status === 'running' 
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                  {readers.reader1.status === 'running' ? 'Activo' : 'Libre'}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {readers.reader1.status === 'running' 
                  ? readers.reader1.logisticId 
                    ? `Cargando Logística #${readers.reader1.logisticId}` 
                    : 'Procesando...'
                  : 'Sin operación activa'}
              </div>
            </div>
          </div>
          
          {/* Carril 2 */}
          <div 
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow 
              ${selectedCarril === 'reader2' ? 'ring-2 ring-indigo-400 dark:ring-indigo-600' : ''}
              ${readers.reader2.status === 'running' 
                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-900' 
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
            onClick={() => setSelectedCarril('reader2')}
          >
            <div className={`h-8 w-8 rounded-full flex items-center justify-center 
              ${readers.reader2.status === 'running' 
                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
              <div className="relative">
                {readers.reader2.status === 'running' && (
                  <div className="absolute inset-0 rounded-full animate-ping bg-indigo-500 opacity-30 h-5 w-5"></div>
                )}
                <Wifi className="h-4 w-4 z-10 relative" />
              </div>
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">
                Carril 2
                <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs uppercase 
                  ${readers.reader2.status === 'running' 
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                  {readers.reader2.status === 'running' ? 'Activo' : 'Libre'}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {readers.reader2.status === 'running' 
                  ? readers.reader2.logisticId 
                    ? `Cargando Logística #${readers.reader2.logisticId}` 
                    : 'Procesando...'
                  : 'Sin operación activa'}
              </div>
            </div>
          </div>
          
          {/* Carril 3 */}
          <div 
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow 
              ${selectedCarril === 'reader3' ? 'ring-2 ring-purple-400 dark:ring-purple-600' : ''}
              ${readers.reader3.status === 'running' 
                ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-900' 
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
            onClick={() => setSelectedCarril('reader3')}
          >
            <div className={`h-8 w-8 rounded-full flex items-center justify-center 
              ${readers.reader3.status === 'running' 
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' 
                : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
              <div className="relative">
                {readers.reader3.status === 'running' && (
                  <div className="absolute inset-0 rounded-full animate-ping bg-purple-500 opacity-30 h-5 w-5"></div>
                )}
                <Wifi className="h-4 w-4 z-10 relative" />
              </div>
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">
                Carril 3
                <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs uppercase 
                  ${readers.reader3.status === 'running' 
                    ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                  {readers.reader3.status === 'running' ? 'Activo' : 'Libre'}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {readers.reader3.status === 'running' 
                  ? readers.reader3.logisticId 
                    ? `Cargando Logística #${readers.reader3.logisticId}` 
                    : 'Procesando...'
                  : 'Sin operación activa'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>

  {/* Lectores RFID */}
  <Card className="border-0 shadow-lg h-full flex flex-col">
  <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b pb-3 flex-shrink-0">
    <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
      <Wifi className="h-5 w-5" />
      Carriles RFID
    </CardTitle>
  </CardHeader>
  <CardContent className="p-4 flex-grow overflow-auto">
    <div className="grid grid-cols-1 gap-3 h-full">
      {/* Lector 1 - Azul */}
      <div className="bg-gradient-to-br from-blue-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm overflow-hidden">
        <div className="bg-blue-600 text-white p-2 flex justify-between items-center">
          <h3 className="font-semibold flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${readers.reader1.status === 'running' 
              ? 'bg-green-300 animate-pulse' 
              : readers.reader1.status === 'idle' 
                ? 'bg-yellow-300' 
                : 'bg-red-300'}`} 
            />
            Carril 1
          </h3>
          {renderReaderStatus(readers.reader1)}
        </div>
        
        <div className="p-2.5">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              readers.reader1.status === 'running' 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                : readers.reader1.status === 'idle' 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                  : readers.reader1.status === 'ERROR'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}>
              {readers.reader1.status === 'running' && (
                <div className="relative">
                  <div className="absolute inset-0 rounded-full animate-ping bg-green-500 opacity-30 h-5 w-5"></div>
                  <Wifi className="h-4 w-4 z-10 relative" />
                </div>
              )}
              {readers.reader1.status === 'idle' && <Wifi className="h-4 w-4" />}
              {readers.reader1.status === 'ERROR' && <AlertCircle className="h-4 w-4" />}
              {readers.reader1.status === 'unknown' && <Wifi className="h-4 w-4 opacity-50" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-500 dark:text-slate-400">Estado</div>
              <div className="text-sm font-bold capitalize text-slate-700 dark:text-slate-200 truncate">
                {readers.reader1.status === 'unknown' ? 'Desconocido' : readers.reader1.status}
              </div>
              <div className="text-xs text-slate-500">
                {readers.reader1.lastUpdate 
                  ? new Date(readers.reader1.lastUpdate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}) 
                  : '--:--:--'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={() => startReading('reader1')} 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                Iniciar
              </div>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => stopReading('reader1')} 
              className="border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              size="sm"
            >
              Detener
            </Button>
          </div>
        </div>
      </div>
      
      {/* Lector 2 - Indigo */}
      <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-xl border border-indigo-200 dark:border-indigo-800 shadow-sm overflow-hidden">
        <div className="bg-indigo-600 text-white p-2 flex justify-between items-center">
          <h3 className="font-semibold flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${readers.reader2.status === 'running' 
              ? 'bg-green-300 animate-pulse' 
              : readers.reader2.status === 'idle' 
                ? 'bg-yellow-300' 
                : 'bg-red-300'}`} 
            />
            Carril 2
          </h3>
          {renderReaderStatus(readers.reader2)}
        </div>
        
        <div className="p-2.5">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              readers.reader2.status === 'running' 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                : readers.reader2.status === 'idle' 
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                  : readers.reader2.status === 'ERROR'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}>
              {readers.reader2.status === 'running' && (
                <div className="relative">
                  <div className="absolute inset-0 rounded-full animate-ping bg-green-500 opacity-30 h-5 w-5"></div>
                  <Wifi className="h-4 w-4 z-10 relative" />
                </div>
              )}
              {readers.reader2.status === 'idle' && <Wifi className="h-4 w-4" />}
              {readers.reader2.status === 'ERROR' && <AlertCircle className="h-4 w-4" />}
              {readers.reader2.status === 'unknown' && <Wifi className="h-4 w-4 opacity-50" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-500 dark:text-slate-400">Estado</div>
              <div className="text-sm font-bold capitalize text-slate-700 dark:text-slate-200 truncate">
                {readers.reader2.status === 'unknown' ? 'Desconocido' : readers.reader2.status}
              </div>
              <div className="text-xs text-slate-500">
                {readers.reader2.lastUpdate 
                  ? new Date(readers.reader2.lastUpdate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}) 
                  : '--:--:--'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={() => startReading('reader2')} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              size="sm"
            >
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                Iniciar
              </div>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => stopReading('reader2')} 
              className="border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              size="sm"
            >
              Detener
            </Button>
          </div>
        </div>
      </div>
      
      {/* Lector 3 - Púrpura */}
      <div className="bg-gradient-to-br from-purple-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-xl border border-purple-200 dark:border-purple-800 shadow-sm overflow-hidden">
        <div className="bg-purple-600 text-white p-2 flex justify-between items-center">
          <h3 className="font-semibold flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${readers.reader3.status === 'running' 
              ? 'bg-green-300 animate-pulse' 
              : readers.reader3.status === 'idle' 
                ? 'bg-yellow-300' 
                : 'bg-red-300'}`} 
            />
            Carril 3
          </h3>
          {renderReaderStatus(readers.reader3)}
        </div>
        
        <div className="p-2.5">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              readers.reader3.status === 'running' 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                : readers.reader3.status === 'idle' 
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' 
                  : readers.reader3.status === 'ERROR'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}>
              {readers.reader3.status === 'running' && (
                <div className="relative">
                  <div className="absolute inset-0 rounded-full animate-ping bg-green-500 opacity-30 h-5 w-5"></div>
                  <Wifi className="h-4 w-4 z-10 relative" />
                </div>
              )}
              {readers.reader3.status === 'idle' && <Wifi className="h-4 w-4" />}
              {readers.reader3.status === 'ERROR' && <AlertCircle className="h-4 w-4" />}
              {readers.reader3.status === 'unknown' && <Wifi className="h-4 w-4 opacity-50" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-500 dark:text-slate-400">Estado</div>
              <div className="text-sm font-bold capitalize text-slate-700 dark:text-slate-200 truncate">
                {readers.reader3.status === 'unknown' ? 'Desconocido' : readers.reader3.status}
              </div>
              <div className="text-xs text-slate-500">
                {readers.reader3.lastUpdate 
                  ? new Date(readers.reader3.lastUpdate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}) 
                  : '--:--:--'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={() => startReading('reader3')} 
              className="bg-purple-600 hover:bg-purple-700 text-white"
              size="sm"
            >
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                Iniciar
              </div>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => stopReading('reader3')} 
              className="border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              size="sm"
            >
              Detener
            </Button>
          </div>
        </div>
      </div>
    </div>
  </CardContent>
</Card>
</div>
        
        {/* Tercera fila - 2 componentes en pestañas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* EPCs detectados */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b pb-3">
              <CardTitle className="text-blue-700 dark:text-blue-400 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Lecturas RFID
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <Tabs defaultValue="valid" className="w-full">
                <TabsList className="mb-4 w-full justify-start bg-slate-100 dark:bg-slate-700/50 p-1">
                  <TabsTrigger 
                    value="valid" 
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      EPCs Válidos ({validEpcs.length})
                    </div>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="invalid"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      No Autorizados ({invalidEpcs.length})
                    </div>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="valid">
                  {validEpcs.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-30 text-blue-500" />
                      <p>No hay EPCs válidos detectados</p>
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-60 overflow-y-auto p-3 border rounded-xl bg-white dark:bg-slate-800">
                      {validEpcs.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 border-b border-slate-100 dark:border-slate-700 last:border-0">
                          <div className="font-mono font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            {item.epc}
                          </div>
                          <div className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                            {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="invalid">
                  {invalidEpcs.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-30 text-amber-500" />
                      <p>No hay EPCs inválidos detectados</p>
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-60 overflow-y-auto p-3 border rounded-xl bg-white dark:bg-slate-800">
                      {invalidEpcs.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 border-b border-slate-100 dark:border-slate-700 last:border-0">
                          <div className="font-mono font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            {item.epc}
                          </div>
                          <div className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                            {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Historial y Detalles */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b pb-3">
              <CardTitle className="text-blue-700 dark:text-blue-400 flex items-center gap-2">
                <Clipboard className="h-5 w-5" />
                Detalles de Seguimiento
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <Tabs defaultValue="history" className="w-full">
                <TabsList className="mb-4 w-full justify-start bg-slate-100 dark:bg-slate-700/50 p-1">
                  <TabsTrigger 
                    value="history" 
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Historial
                    </div>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="products"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Productos
                    </div>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="stats"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow"
                  >
                    <div className="flex items-center gap-2">
                      <LineChart className="h-4 w-4" />
                      Estadísticas
                    </div>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="history">
                  <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border">
                    <div className="max-h-60 overflow-y-auto">
                      <Table className="w-full">
                        <TableHeader className="bg-slate-50 dark:bg-slate-900/50 sticky top-0">
                          <TableRow className="hover:bg-slate-100 dark:hover:bg-slate-800">
                            <TableHead className="text-blue-700 dark:text-blue-400 font-semibold">Hora</TableHead>
                            <TableHead className="text-blue-700 dark:text-blue-400 font-semibold">Estado</TableHead>
                            <TableHead className="text-blue-700 dark:text-blue-400 font-semibold">Ubicación</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {product.scanHistory.map((scan, index) => (
                            <TableRow key={index} className="hover:bg-slate-50 dark:hover:bg-slate-900/20">
                              <TableCell className="font-mono text-sm">{scan.time}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={
                                  scan.status === "detected" ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700" :
                                  scan.status === "verified" ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700" :
                                  "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700"
                                }>
                                  <div className="flex items-center gap-1.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${
                                      scan.status === "detected" ? "bg-blue-500" :
                                      scan.status === "verified" ? "bg-green-500" : "bg-amber-500"
                                    }`}></div>
                                    
                                    {scan.status === "detected" ? "Detectado" : 
                                     scan.status === "verified" ? "Verificado" : "En Carga"}
                                  </div>
                                </Badge>
                              </TableCell>
                              <TableCell>{scan.location}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="products">
                  <div className="text-center py-10 text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-20 text-blue-500" />
                    <p className="text-lg font-medium mb-1">Sin productos adicionales</p>
                    <p className="text-sm">Seleccione un camión para ver la lista completa</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="stats">
                  <div className="text-center py-10 text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border">
                    <LineChart className="h-12 w-12 mx-auto mb-3 opacity-20 text-blue-500" />
                    <p className="text-lg font-medium mb-1">Estadísticas no disponibles</p>
                    <p className="text-sm">Las estadísticas estarán disponibles al finalizar</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 py-3 px-4 border-t shadow-inner">
        <div className="container mx-auto text-sm text-slate-500 flex justify-between items-center">
          <span className="font-medium">Sistema de Embarque RFID v1.0</span>
          <span>© 2025 Logística Inteligente</span>
        </div>
      </footer>
    </div>
  )
}


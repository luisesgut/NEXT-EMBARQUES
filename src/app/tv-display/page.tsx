"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Package, Truck, QrCode, Clock, CheckCircle2, AlertCircle } from 'lucide-react'

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

import { mockProduct } from "@/lib/data/mock-data"

export default function TvProductDisplay() {
  const [product, setProduct] = useState(mockProduct)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [loadingProgress, setLoadingProgress] = useState(
    Math.round((product.loadedQuantity / product.totalQuantity) * 100)
  )
  const [isNewScan, setIsNewScan] = useState(false)
  
  // Actualizar el reloj cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])
  
  // Simular actualización de progreso
  useEffect(() => {
    if (product.status === "loading" && loadingProgress < 100) {
      const timer = setInterval(() => {
        setLoadingProgress(prev => {
          const newProgress = Math.min(prev + 1, 100)
          
          const newLoadedQuantity = Math.round((newProgress / 100) * product.totalQuantity)
          setProduct(prev => ({
            ...prev,
            loadedQuantity: newLoadedQuantity,
            status: newProgress === 100 ? "completed" : "loading"
          }))
          
          return newProgress
        })
      }, 3000)
      
      return () => clearInterval(timer)
    }
  }, [loadingProgress, product.status, product.totalQuantity])
  
  // Simular detección RFID
  useEffect(() => {
    const scanTimer = setInterval(() => {
      setIsNewScan(true)
      
      setProduct(prev => ({
        ...prev,
        lastScan: new Date().toISOString()
      }))
      
      setTimeout(() => {
        setIsNewScan(false)
      }, 3000)
    }, 15000)
    
    return () => clearInterval(scanTimer)
  }, [])
  
  // Formatear tiempo restante
  const getTimeRemaining = () => {
    if (product.status === "completed") return "Completado"
    
    const estimatedEnd = new Date(product.estimatedCompletion)
    const diffMs = estimatedEnd.getTime() - currentTime.getTime()
    
    if (diffMs <= 0) return "Finalizando..."
    
    const diffMins = Math.floor(diffMs / 60000)
    const diffSecs = Math.floor((diffMs % 60000) / 1000)
    
    return `${diffMins}:${diffSecs.toString().padStart(2, '0')}`
  }
  
  // Formatear la última actualización
  const getLastUpdateTime = () => {
    const lastScan = new Date(product.lastScan)
    return lastScan.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  
  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="bg-blue-700 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8" />
          <h1 className="text-2xl font-bold">Sistema RFID</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-2xl font-mono">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <Link href="/dashboard">
            <Button variant="secondary" size="sm">
              Dashboard
            </Button>
          </Link>
        </div>
      </header>
      
      {/* Notificación de nueva lectura */}
      {isNewScan && (
        <div className="bg-green-500 text-white p-2 text-center animate-pulse">
          Nueva detección RFID - {getLastUpdateTime()}
        </div>
      )}
      
      {/* Contenido principal */}
      <main className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Imagen e info básica */}
        <div className="lg:col-span-1">
          <Card className={`h-full ${isNewScan ? 'ring-2 ring-green-500' : ''}`}>
            <CardContent className="p-6 flex flex-col h-full">
              <h2 className="text-xl font-semibold text-blue-800 mb-4">Producto Detectado</h2>
              
              <div className="relative flex-1 min-h-[350px] mb-4">
                <Image 
                  src="https://bioflex.mx/wp-content/uploads/2024/03/standup_pouch.png"
                  alt={product.name}
                  fill
                  className="object-contain"
                />
                <Badge className="absolute top-2 right-2 bg-blue-600">
                  {product.category}
                </Badge>
              </div>
              
              <div className="mt-auto space-y-4">
                <div className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-blue-700" />
                  <span className="font-mono">{product.rfidTag}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Código</p>
                    <p className="font-medium">{product.sku}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Andén</p>
                    <p className="font-medium">{product.truckInfo.dockNumber}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Información y progreso */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Nombre y estado */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h2 className="text-3xl font-bold mb-1">{product.name}</h2>
                  <p className="text-gray-600">{product.description}</p>
                </div>
                <Badge className={`${
                  product.status === "loading" ? "bg-blue-500" :
                  product.status === "completed" ? "bg-green-500" :
                  "bg-red-500"
                }`}>
                  {product.status === "loading" ? "En Carga" :
                   product.status === "completed" ? "Completado" :
                   "Error"}
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          {/* Progreso */}
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold">Progreso de Embarque</h3>
                  <p className="text-sm text-gray-500">
                    Última actualización: {getLastUpdateTime()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-700">{loadingProgress}%</div>
                  <p className="text-sm text-gray-500">Tiempo: {getTimeRemaining()}</p>
                </div>
              </div>
              
              <Progress 
                value={loadingProgress} 
                className="h-6 bg-gray-100" 
                indicatorClassName={
                  loadingProgress === 100 
                    ? "bg-green-500" 
                    : "bg-blue-600"
                }
              />
              
              <div className="flex justify-between mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-700" />
                  <span>
                    <span className="font-bold">{product.loadedQuantity}</span>
                    <span className="text-gray-500"> / {product.totalQuantity} unidades</span>
                  </span>
                </div>
                <div className="text-gray-700">
                  {product.weight}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Detalles en grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Info de embarque */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-blue-700" />
                  Información de Embarque
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-500 text-sm">Destino</p>
                    <p className="font-medium">{product.destination.name}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-500 text-sm">ID Camión</p>
                      <p>{product.truckInfo.id}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Placa</p>
                      <p>{product.truckInfo.plate}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-gray-500 text-sm">Conductor</p>
                    <p>{product.truckInfo.driver}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Estado del embarque */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-700" />
                  Estado del Embarque
                </h3>
                
                <div className="space-y-4">
                  <div>
                    {product.status === "completed" ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-6 w-6" />
                        <span className="font-medium">Embarque Completado</span>
                      </div>
                    ) : product.status === "error" ? (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="h-6 w-6" />
                        <span className="font-medium">Error en Embarque</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-blue-600">
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full animate-ping bg-blue-500 opacity-30"></div>
                          <div className="relative h-2 w-2 rounded-full bg-blue-600"></div>
                        </div>
                        <span className="font-medium">En Progreso</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-500 text-sm">Cargadas</p>
                      <p className="text-2xl font-bold text-blue-700">{product.loadedQuantity}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Pendientes</p>
                      <p className="text-2xl font-medium text-gray-700">{product.totalQuantity - product.loadedQuantity}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-100 p-3 border-t border-gray-200">
        <div className="container mx-auto flex justify-between items-center text-gray-600 text-sm">
          <span>Sistema de Embarque RFID v1.0</span>
          <span>Andén {product.truckInfo.dockNumber} • {currentTime.toLocaleDateString()}</span>
        </div>
      </footer>
    </div>
  )
}
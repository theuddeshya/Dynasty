import { useState, useEffect, useRef, useCallback } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { Search, Users, Info, Maximize2, Minimize2, Filter, Zap, Star, Settings, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import FamilyFilter from '@/components/FamilyFilter'
import ProfessionFilter from '@/components/ProfessionFilter'

interface FamilyMember {
  name: string
  profession: string
  bio: string
  connections: string[]
}

interface Family {
  family_name: string
  members: FamilyMember[]
}

interface GraphNode {
  id: string
  name: string
  profession: string
  bio: string
  connections: string[]
  family: string
  val: number
  color: string
  x?: number
  y?: number
}

interface GraphLink {
  source: string | GraphNode
  target: string | GraphNode
  type: string
  strength: number
  color: string
  relationship?: string
}

interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

export default function Home() {

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] })
  const [filteredData, setFilteredData] = useState<GraphData>({ nodes: [], links: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
  const [selectedFamilies, setSelectedFamilies] = useState<string[]>([])
  const [selectedProfessions, setSelectedProfessions] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [showLabels, setShowLabels] = useState(true)
  const [allFamilies, setAllFamilies] = useState<string[]>([])
  const [allProfessions, setAllProfessions] = useState<string[]>([])
  const graphRef = useRef<any>(null)

  // Load and process family data
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/data.json')
        const familiesData: Family[] = await response.json()

        const nodes: GraphNode[] = []
        const links: GraphLink[] = []

        // Extract unique families and professions
        const families = new Set<string>()
        const professions = new Set<string>()

        familiesData.forEach((family, familyIndex) => {
          families.add(family.family_name)
          family.members.forEach((member, memberIndex) => {
            if (member.profession && member.profession.trim()) {
              professions.add(member.profession)
            }

            const nodeId = `${familyIndex}-${memberIndex}`
            const node: GraphNode = {
              id: nodeId,
              name: member.name,
              profession: member.profession,
              bio: member.bio,
              connections: member.connections,
              family: family.family_name,
              val: 8 + Math.random() * 4,
              color: getNodeColor(member.profession),
              x: Math.random() * 800,
              y: Math.random() * 600
            }
            nodes.push(node)
          })
        })

        // Create links
        familiesData.forEach((family, familyIndex) => {
          family.members.forEach((member, memberIndex) => {
            const sourceId = `${familyIndex}-${memberIndex}`

            // Link family members
            family.members.forEach((otherMember, otherIndex) => {
              if (memberIndex !== otherIndex) {
                const targetId = `${familyIndex}-${otherIndex}`
                links.push({
                  source: sourceId,
                  target: targetId,
                  type: 'family',
                  strength: 0.3,
                  color: 'rgba(255, 255, 255, 0.2)'
                })
              }
            })

            // Link based on connections
            member.connections.forEach(connection => {
              const connectionText = connection.toLowerCase()
              nodes.forEach(node => {
                if (node.id !== sourceId && connectionText.includes(node.name.toLowerCase())) {
                  links.push({
                    source: sourceId,
                    target: node.id,
                    type: 'relationship',
                    strength: 0.8,
                    relationship: connection,
                    color: 'rgba(255, 255, 255, 0.4)'
                  })
                }
              })
            })
          })
        })

        const processedData = { nodes, links }
        setGraphData(processedData)
        setFilteredData(processedData)
        setAllFamilies(Array.from(families).sort())
        setAllProfessions(Array.from(professions).sort())
        setIsLoading(false)
      } catch (error) {
        console.error('Error loading data:', error)
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Filter data based on search, families, and professions
  useEffect(() => {
    let filteredNodes = graphData.nodes

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filteredNodes = filteredNodes.filter(node =>
        node.name.toLowerCase().includes(searchLower) ||
        node.profession.toLowerCase().includes(searchLower) ||
        node.family.toLowerCase().includes(searchLower)
      )
    }

    if (selectedFamilies.length > 0) {
      filteredNodes = filteredNodes.filter(node =>
        selectedFamilies.includes(node.family)
      )
    }

    if (selectedProfessions.length > 0) {
      filteredNodes = filteredNodes.filter(node =>
        selectedProfessions.includes(node.profession)
      )
    }

    const filteredNodeIds = new Set(filteredNodes.map(n => n.id))
    const filteredLinks = graphData.links.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as GraphNode).id
      const targetId = typeof link.target === 'string' ? link.target : (link.target as GraphNode).id
      return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId)
    })

    setFilteredData({ nodes: filteredNodes, links: filteredLinks })
  }, [searchTerm, selectedFamilies, selectedProfessions, graphData])

  const getNodeColor = (profession: string): string => {
    const professionLower = profession.toLowerCase()
    if (professionLower.includes('actor') || professionLower.includes('actress')) return '#e74c3c'
    if (professionLower.includes('director')) return '#3498db'
    if (professionLower.includes('producer')) return '#f39c12'
    if (professionLower.includes('singer')) return '#9b59b6'
    if (professionLower.includes('politician')) return '#27ae60'
    if (professionLower.includes('writer') || professionLower.includes('poet')) return '#e67e22'
    return '#95a5a6'
  }

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node)
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 1000)
      graphRef.current.zoom(2, 1000)
    }
  }, [])

  const renderCustomNode = useCallback((node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.name
    const fontSize = Math.max(10, 14 / globalScale)
    ctx.font = `${fontSize}px Inter, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const radius = node.val

    // Glow effect
    if ((hoveredNode && hoveredNode.id === node.id) || (selectedNode && selectedNode.id === node.id)) {
      ctx.shadowColor = node.color
      ctx.shadowBlur = 20
    } else {
      ctx.shadowBlur = 0
    }

    // Main circle
    ctx.beginPath()
    ctx.arc(node.x || 0, node.y || 0, radius, 0, 2 * Math.PI, false)
    ctx.fillStyle = node.color
    ctx.fill()

    // Border
    ctx.strokeStyle = selectedNode && selectedNode.id === node.id ? '#ffffff' : 'rgba(255, 255, 255, 0.8)'
    ctx.lineWidth = selectedNode && selectedNode.id === node.id ? 3 / globalScale : 2 / globalScale
    ctx.stroke()

    // Inner highlight
    ctx.beginPath()
    ctx.arc((node.x || 0) - radius / 3, (node.y || 0) - radius / 3, radius / 3, 0, 2 * Math.PI, false)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.fill()

    ctx.shadowBlur = 0

    // Draw label
    if (showLabels && globalScale > 0.5) {
      const textWidth = ctx.measureText(label).width
      const padding = 4

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(
        (node.x || 0) - textWidth / 2 - padding,
        (node.y || 0) + radius + 4,
        textWidth + padding * 2,
        fontSize + padding
      )

      ctx.fillStyle = 'white'
      ctx.fillText(label, node.x || 0, (node.y || 0) + radius + fontSize / 2 + 8)
    }
  }, [hoveredNode, selectedNode, showLabels])

  const hasActiveFilters = searchTerm || selectedFamilies.length > 0 || selectedProfessions.length > 0

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="backdrop-blur-md bg-white/10 border border-white/20 p-8 rounded-2xl text-center">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full mx-auto mb-4 animate-spin"></div>
          <p className="text-white text-lg">Loading Bollywood Family Trees...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Users className="w-8 h-8 text-white" />
                  <Star className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Bollywood Family Trees</h1>
                  <p className="text-white/70 text-sm">Interactive Dynasty Explorer</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setShowLabels(!showLabels)}
                  variant="ghost"
                  size="sm"
                  className="backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 text-white"
                >
                  {showLabels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant="ghost"
                  size="sm"
                  className="backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 text-white"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Filters
                </Button>
                {hasActiveFilters && (
                  <Button
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedFamilies([])
                      setSelectedProfessions([])
                    }}
                    variant="ghost"
                    size="sm"
                    className="backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 text-white"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                )}
                <Button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  variant="ghost"
                  size="icon"
                  className="backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 text-white"
                >
                  {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </Button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
              <Input
                placeholder="Search families, names, or professions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 backdrop-blur-md bg-white/20 border-white/30 text-white placeholder:text-white/60"
              />
              {filteredData.nodes.length !== graphData.nodes.length && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                    {filteredData.nodes.length} / {graphData.nodes.length}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`relative z-10 ${isFullscreen ? 'fixed inset-0 pt-0' : 'px-6 pb-6'}`}>
        <div className={`${isFullscreen ? 'h-full' : 'max-w-7xl mx-auto'}`}>
          <div className={`grid gap-6 h-full ${
            isFullscreen
              ? 'grid-cols-1'
              : showFilters
                ? 'grid-cols-1 lg:grid-cols-6'
                : 'grid-cols-1 lg:grid-cols-4'
          }`}>

            {/* Filters Panel */}
            {showFilters && !isFullscreen && (
              <div className="lg:col-span-2 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                <FamilyFilter
                  families={allFamilies}
                  selectedFamilies={selectedFamilies}
                  onFamilyToggle={(family) => {
                    setSelectedFamilies(prev =>
                      prev.includes(family)
                        ? prev.filter(f => f !== family)
                        : [...prev, family]
                    )
                  }}
                  onClearAll={() => setSelectedFamilies([])}
                />
                <ProfessionFilter
                  professions={allProfessions}
                  selectedProfessions={selectedProfessions}
                  onProfessionToggle={(profession: string) => {
                    setSelectedProfessions(prev =>
                      prev.includes(profession)
                        ? prev.filter(p => p !== profession)
                        : [...prev, profession]
                    )
                  }}
                  onClearAll={() => setSelectedProfessions([])}
                />
              </div>
            )}

            {/* Graph */}
            <div className={`${
              isFullscreen
                ? 'col-span-1'
                : showFilters
                  ? 'lg:col-span-3'
                  : 'lg:col-span-3'
            } backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-2xl overflow-hidden`}>
              <div className="h-full min-h-[600px] relative">
                <ForceGraph2D
                  ref={graphRef}
                  graphData={filteredData}
                  nodeCanvasObject={renderCustomNode}
                  linkColor={(link) => (link as GraphLink).color || 'rgba(255, 255, 255, 0.3)'}
                  linkWidth={2}
                  onNodeClick={handleNodeClick}
                  onNodeHover={setHoveredNode}
                  backgroundColor="transparent"
                  nodeRelSize={6}
                  linkDirectionalParticles={1}
                  linkDirectionalParticleSpeed={0.003}
                  linkDirectionalParticleWidth={2}
                  linkDirectionalParticleColor={() => 'rgba(255, 255, 255, 0.6)'}
                  cooldownTicks={100}
                  onEngineStop={() => graphRef.current?.zoomToFit(400)}
                />

                <div className="absolute top-4 right-4 flex flex-col space-y-2">
                  <Button
                    onClick={() => graphRef.current?.zoomToFit(400)}
                    size="sm"
                    className="backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 text-white"
                  >
                    <Zap className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Info Panel */}
            {!isFullscreen && !showFilters && (
              <div className="lg:col-span-1 space-y-6">
                {selectedNode ? (
                  <Card className="backdrop-blur-md bg-white/10 border-white/20 text-white shadow-2xl">
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center space-x-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: selectedNode.color }}
                        ></div>
                        <span>{selectedNode.name}</span>
                      </CardTitle>
                      <CardDescription className="text-white/80">
                        {selectedNode.family}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedNode.profession && (
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                          {selectedNode.profession}
                        </Badge>
                      )}

                      {selectedNode.bio && (
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center">
                            <Info className="w-4 h-4 mr-2" />
                            Biography
                          </h4>
                          <p className="text-sm text-white/90 leading-relaxed">{selectedNode.bio}</p>
                        </div>
                      )}

                      {selectedNode.connections && selectedNode.connections.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            Connections
                          </h4>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {selectedNode.connections.map((connection, index) => (
                              <Badge key={index} variant="outline" className="text-xs border-white/30 text-white/80 mr-1 mb-1">
                                {connection}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="backdrop-blur-md bg-white/10 border-white/20 text-white shadow-2xl">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Info className="w-5 h-5" />
                        <span>Welcome</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-white/90 mb-4 leading-relaxed">
                        Explore the interconnected world of Bollywood families. Click on any node to learn more about family members and their relationships.
                      </p>
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Legend:</h4>
                        <div className="grid grid-cols-1 gap-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span className="text-sm">Actors/Actresses</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-sm">Directors</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                            <span className="text-sm">Producers</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                            <span className="text-sm">Singers</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-sm">Politicians</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="backdrop-blur-md bg-white/10 border-white/20 text-white shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Star className="w-5 h-5 text-yellow-400" />
                      <span>Statistics</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white/80">Families:</span>
                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-200 border-blue-400/30">
                          {graphData.nodes.length > 0 ? allFamilies.length : 0}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/80">Total Members:</span>
                        <Badge variant="secondary" className="bg-green-500/20 text-green-200 border-green-400/30">
                          {graphData.nodes.length}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/80">Connections:</span>
                        <Badge variant="secondary" className="bg-purple-500/20 text-purple-200 border-purple-400/30">
                          {graphData.links.length}
                        </Badge>
                      </div>
                      {hasActiveFilters && (
                        <div className="flex justify-between items-center pt-2 border-t border-white/20">
                          <span className="text-yellow-300">Filtered Results:</span>
                          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-200 border-yellow-400/30">
                            {filteredData.nodes.length}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

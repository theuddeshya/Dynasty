import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Briefcase, X } from 'lucide-react'

interface ProfessionFilterProps {
  professions: string[]
  selectedProfessions: string[]
  onProfessionToggle: (profession: string) => void
  onClearAll: () => void
}

export default function ProfessionFilter({
  professions,
  selectedProfessions,
  onProfessionToggle,
  onClearAll
}: ProfessionFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getProfessionColor = (profession: string): string => {
    const professionLower = profession.toLowerCase()
    if (professionLower.includes('actor') || professionLower.includes('actress')) return 'bg-red-500/20 text-red-200 border-red-400/30'
    if (professionLower.includes('director')) return 'bg-blue-500/20 text-blue-200 border-blue-400/30'
    if (professionLower.includes('producer')) return 'bg-orange-500/20 text-orange-200 border-orange-400/30'
    if (professionLower.includes('singer')) return 'bg-purple-500/20 text-purple-200 border-purple-400/30'
    if (professionLower.includes('politician')) return 'bg-green-500/20 text-green-200 border-green-400/30'
    return 'bg-gray-500/20 text-gray-200 border-gray-400/30'
  }

  return (
    <Card className="backdrop-blur-md bg-white/10 border-white/20 text-white shadow-2xl">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Briefcase className="w-5 h-5" />
            <span>Profession Filter</span>
          </div>
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant="ghost"
            size="sm"
            className="backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {selectedProfessions.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/80">Active Filters:</span>
              <Button
                onClick={onClearAll}
                variant="ghost"
                size="sm"
                className="text-xs text-white/60 hover:text-white p-0 h-auto"
              >
                <X className="w-3 h-3 mr-1" />
                Clear All
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedProfessions.map(profession => (
                <Badge
                  key={profession}
                  variant="secondary"
                  className={`${getProfessionColor(profession)} cursor-pointer`}
                  onClick={() => onProfessionToggle(profession)}
                >
                  {profession}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
          </div>
        )}

        {isExpanded && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {professions.map(profession => (
              <div
                key={profession}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                onClick={() => onProfessionToggle(profession)}
              >
                <span className="text-sm">{profession}</span>
                <div className={`w-4 h-4 rounded border-2 ${
                  selectedProfessions.includes(profession)
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-white/40'
                }`}>
                  {selectedProfessions.includes(profession) && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

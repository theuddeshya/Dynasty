import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Filter, X } from 'lucide-react'

interface FamilyFilterProps {
  families: string[]
  selectedFamilies: string[]
  onFamilyToggle: (family: string) => void
  onClearAll: () => void
}

export default function FamilyFilter({
  families,
  selectedFamilies,
  onFamilyToggle,
  onClearAll
}: FamilyFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="backdrop-blur-md bg-white/10 border-white/20 text-white shadow-2xl">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Family Filter</span>
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
        {selectedFamilies.length > 0 && (
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
              {selectedFamilies.map(family => (
                <Badge
                  key={family}
                  variant="secondary"
                  className="bg-blue-500/20 text-blue-200 border-blue-400/30 cursor-pointer"
                  onClick={() => onFamilyToggle(family)}
                >
                  {family.replace(' family', '')}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
          </div>
        )}

        {isExpanded && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {families.map(family => (
              <div
                key={family}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                onClick={() => onFamilyToggle(family)}
              >
                <span className="text-sm">{family.replace(' family', '')}</span>
                <div className={`w-4 h-4 rounded border-2 ${
                  selectedFamilies.includes(family)
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-white/40'
                }`}>
                  {selectedFamilies.includes(family) && (
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

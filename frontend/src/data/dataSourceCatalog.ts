import type { EMADataSource } from '@/types'
import raw from './ema_data_sources.json'

interface CatalogRaw {
  _meta: {
    source: string
    note: string
    total: number
    fields: string[]
  }
  sources: EMADataSource[]
}

const catalog = raw as CatalogRaw

export const DATA_SOURCES: EMADataSource[] = catalog.sources

export const SOURCE_TYPES: string[] = Array.from(
  new Set(DATA_SOURCES.map((s) => s.type).filter((t): t is string => !!t))
).sort()

export const CARE_SETTINGS: string[] = Array.from(
  new Set(DATA_SOURCES.map((s) => s.care_setting).filter((c): c is string => !!c))
).sort()

export const COUNTRIES: string[] = Array.from(
  new Set(
    DATA_SOURCES.flatMap((s) =>
      s.countries ? s.countries.split(',').map((c) => c.trim()) : []
    ).filter(Boolean)
  )
).sort()

export const CODING_VOCABS: string[] = Array.from(
  new Set(
    DATA_SOURCES.flatMap((s) => {
      const vocabs: string[] = []
      if (s.dx_vocabulary) vocabs.push(...s.dx_vocabulary.split(',').map((v) => v.trim()))
      if (s.rx_vocabulary) vocabs.push(...s.rx_vocabulary.split(',').map((v) => v.trim()))
      if (s.cod_vocabulary) vocabs.push(...s.cod_vocabulary.split(',').map((v) => v.trim()))
      if (s.drug_vocabulary) vocabs.push(...s.drug_vocabulary.split(',').map((v) => v.trim()))
      return vocabs.filter(Boolean)
    })
  )
).sort()

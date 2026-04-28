import { describe, it, expect } from 'vitest'
import { detectFileType, isLargeDocument, type ExtractionResult } from '../extractor'

describe('detectFileType', () => {
  it('detects pdf', () => expect(detectFileType('report.pdf')).toBe('pdf'))
  it('detects docx', () => expect(detectFileType('doc.docx')).toBe('docx'))
  it('detects xlsx', () => expect(detectFileType('sheet.xlsx')).toBe('xlsx'))
  it('detects xls', () => expect(detectFileType('sheet.xls')).toBe('xlsx'))
  it('detects csv', () => expect(detectFileType('data.csv')).toBe('csv'))
  it('detects png as image', () => expect(detectFileType('photo.png')).toBe('image'))
  it('detects jpg as image', () => expect(detectFileType('photo.jpg')).toBe('image'))
  it('detects txt', () => expect(detectFileType('notes.txt')).toBe('txt'))
  it('defaults unknown to txt', () => expect(detectFileType('file.xyz')).toBe('txt'))
})

describe('isLargeDocument', () => {
  it('returns false for 80 pages', () => expect(isLargeDocument(80)).toBe(false))
  it('returns true for 81 pages', () => expect(isLargeDocument(81)).toBe(true))
  it('returns false for 0 pages', () => expect(isLargeDocument(0)).toBe(false))
})

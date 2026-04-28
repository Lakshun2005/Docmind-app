import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }
const icon = (path: string) => ({ size = 14, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {path.split('|').map((d, i) => <path key={i} d={d} />)}
  </svg>
)

export const HomeIcon        = icon('M2 6.5L8 2l6 4.5V14H10v-3.5H6V14H2z')
export const FolderIcon      = icon('M2 4.5a1 1 0 011-1h3.5l1.5 1.5H13a1 1 0 011 1V12a1 1 0 01-1 1H3a1 1 0 01-1-1z')
export const FileIcon        = icon('M4 2h5.5L12 4.5V14H4V2z|M9.5 2v3H12')
export const ChatIcon        = icon('M2 3.5h12v7.5H9l-3 2v-2H2z')
export const SparkleIcon     = icon('M8 1v3|M8 12v3|M1 8h3|M12 8h3|M3.5 3.5l2 2|M10.5 10.5l2 2|M10.5 3.5l-2 2|M5.5 8.5l-2 2')
export const StarIcon        = icon('M8 1l1.8 4h4.2l-3.4 2.5 1.3 4L8 9 4.1 11.5l1.3-4L2 5h4.2z')
export const PlusIcon        = icon('M8 2v12|M2 8h12')
export const ChevronRightIcon= icon('M6 4l4 4 -4 4')
export const ChevronDownIcon = icon('M4 6l4 4 4 -4')
export const ChevronLeftIcon = icon('M10 4L6 8l4 4')
export const UploadIcon      = icon('M8 10V3|M5 6l3-3 3 3|M3 12h10')
export const DownloadIcon    = icon('M8 3v7|M5 7l3 3 3-3|M3 12h10')
export const ShareIcon       = icon('M11 2a2 2 0 100 4 2 2 0 000-4zM5 8a2 2 0 100 4 2 2 0 000-4zM11 10a2 2 0 100 4 2 2 0 000-4z|M7 9.5l-4.5 3.5|M7 6.5L11.5 4')
export const CopyIcon        = icon('M11 4H5a1 1 0 00-1 1v8a1 1 0 001 1h6a1 1 0 001-1V5a1 1 0 00-1-1z|M10 4V3H4a1 1 0 00-1 1v8')
export const TrashIcon       = icon('M2 4h12|M6 4V2h4v2|M5 4v9a1 1 0 001 1h4a1 1 0 001-1V4')
export const SearchIcon      = icon('M7 12A5 5 0 107 2a5 5 0 000 10z|M11 11l3 3')
export const SettingsIcon    = icon('M8 10a2 2 0 100-4 2 2 0 000 4z|M13.2 8c0-.2 0-.3-.1-.5l1.4-1.1-1.4-2.4-1.7.7c-.3-.2-.6-.4-.9-.5L10 2H7.9l-.5 2.2c-.3.1-.6.3-.9.5l-1.7-.7L3.4 6.5l1.4 1.1c0 .2-.1.3-.1.5s0 .3.1.5L3.4 9.5l1.4 2.4 1.7-.7c.3.2.6.4.9.5l.5 2.2H10l.5-2.2c.3-.1.6-.3.9-.5l1.7.7 1.4-2.4-1.4-1.1c.1-.2.1-.3.1-.5z')
export const SunIcon         = icon('M8 4V2|M8 14v-2|M4 8H2|M14 8h-2|M5.5 5.5l-1.4-1.4|M11.9 11.9l-1.4-1.4|M5.5 10.5l-1.4 1.4|M11.9 4.1l-1.4 1.4|M8 11a3 3 0 100-6 3 3 0 000 6z')
export const MoonIcon        = icon('M6 2a6 6 0 106 10.4A7 7 0 016 2z')
export const DotsIcon        = icon('M4 8a1 1 0 100-2 1 1 0 000 2z|M8 8a1 1 0 100-2 1 1 0 000 2z|M12 8a1 1 0 100-2 1 1 0 000 2z')
export const HighlightIcon   = icon('M10.5 2l3.5 3.5-7 7H3.5V9z|M7.5 4.5l4 4')
export const SendIcon        = icon('M2 8l12-6-4 12-3-4.5z|M14 2L8 8')
export const RefreshIcon     = icon('M12.5 3.5A6 6 0 012 8h2|M3.5 12.5A6 6 0 0014 8h-2|M2 5V3h2|M12 13h2v-2')
export const XIcon           = icon('M3 3l10 10|M13 3L3 13')
export const CheckIcon       = icon('M2.5 8l4 4 7 -7')
export const WarningIcon     = icon('M8 2L1 14h14L8 2z|M8 6v4|M8 11.5v1')
export const EyeIcon         = icon('M1 8s3-6 7-6 7 6 7 6-3 6-7 6-7-6-7-6z|M8 10a2 2 0 100-4 2 2 0 000 4z')
export const PaperclipIcon   = icon('M13 7l-5.5 5.5a3 3 0 01-4.2-4.2l5.5-5.5a1.5 1.5 0 012.1 2.1L5.4 10.5a.5.5 0 01-.7-.7L10 4.5')
export const MicIcon         = icon('M8 2a2 2 0 012 2v4a2 2 0 01-4 0V4a2 2 0 012-2z|M4 8a4 4 0 008 0|M8 12v2|M6 14h4')
export const ArrowIcon       = icon('M2 8l12-6-4 12-3-4.5z|M14 2L8 8')
export const BookIcon        = icon('M3 2h8a1 1 0 011 1v10l-4-2-4 2V3a1 1 0 011-1z|M3 2a2 2 0 00-2 2v9')
export const TargetIcon      = icon('M8 14A6 6 0 108 2a6 6 0 000 12z|M8 10a2 2 0 100-4 2 2 0 000 4z|M8 8h0')
export const BoltIcon        = icon('M9 2L4 9h4l-1 5 6-7H9z')
export const GlobeIcon       = icon('M8 2a6 6 0 100 12A6 6 0 008 2z|M2 8h12|M8 2a9 9 0 010 12|M8 2a9 9 0 000 12')
export const BankIcon        = icon('M2 13h12|M3 13V7|M6 13V7|M10 13V7|M13 13V7|M1 7h14|M8 2L1 6h14z')
export const StackIcon       = icon('M2 10l6 3 6-3|M2 7l6 3 6-3|M2 4l6-2 6 2-6 3z')
export const BriefcaseIcon   = icon('M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1|M2 4h12a1 1 0 011 1v7a1 1 0 01-1 1H2a1 1 0 01-1-1V5a1 1 0 011-1z|M5 9h6')

export const I = {
  Home:       HomeIcon,
  Folder:     FolderIcon,
  File:       FileIcon,
  Chat:       ChatIcon,
  Sparkle:    SparkleIcon,
  Star:       StarIcon,
  Plus:       PlusIcon,
  ChevronRight: ChevronRightIcon,
  ChevronDown:  ChevronDownIcon,
  ChevronLeft:  ChevronLeftIcon,
  Upload:     UploadIcon,
  Download:   DownloadIcon,
  Share:      ShareIcon,
  Copy:       CopyIcon,
  Trash:      TrashIcon,
  Search:     SearchIcon,
  Settings:   SettingsIcon,
  Sun:        SunIcon,
  Moon:       MoonIcon,
  Dots:       DotsIcon,
  Highlight:  HighlightIcon,
  Send:       SendIcon,
  Refresh:    RefreshIcon,
  X:          XIcon,
  Check:      CheckIcon,
  Warning:    WarningIcon,
  Eye:        EyeIcon,
  Paperclip:  PaperclipIcon,
  Mic:        MicIcon,
  Arrow:      ArrowIcon,
  Book:       BookIcon,
  Target:     TargetIcon,
  Bolt:       BoltIcon,
  Globe:      GlobeIcon,
  Bank:       BankIcon,
  Stack:      StackIcon,
  Briefcase:  BriefcaseIcon,
}

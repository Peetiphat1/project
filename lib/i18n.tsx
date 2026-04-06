'use client'

/**
 * lib/i18n.tsx
 *
 * Minimal Thai / English language context.
 * Usage:
 *   const { t, lang, setLang } = useLanguage()
 *   t('dashboard')  // → 'แดชบอร์ด' | 'Dashboard'
 */

import { createContext, useContext, useState, type ReactNode } from 'react'

export type Lang = 'en' | 'th'

const dict = {
  // Navigation
  dashboard:        { en: 'Dashboard',           th: 'แดชบอร์ด' },
  myRoutes:         { en: 'My Routes',            th: 'เส้นทางของฉัน' },
  gear:             { en: 'Gear',                 th: 'อุปกรณ์' },

  // Dashboard hero
  recentPerformance:{ en: 'Recent Performance',   th: 'ผลงานล่าสุด' },
  activityFeed:     { en: 'Activity Feed',        th: 'ฟีดกิจกรรม' },
  trainingInsights: { en: 'Training Insights',    th: 'ข้อมูลเชิงลึก' },

  // Quick stats
  weeklyKm:         { en: 'Weekly KM',            th: 'ระยะรายสัปดาห์' },
  avgPace:          { en: 'Avg Pace',             th: 'เพซเฉลี่ย' },
  runs:             { en: 'Runs',                 th: 'วิ่ง' },
  thisWeek:         { en: 'this wk',              th: 'สัปดาห์นี้' },

  // Strava
  connectStrava:    { en: 'Connect Strava',       th: 'เชื่อมต่อ Strava' },
  stravaConnected:  { en: 'Connected',            th: 'เชื่อมต่อแล้ว' },
  disconnectStrava: { en: 'Disconnect Strava',    th: 'ตัดการเชื่อมต่อ' },
  viewOnStrava:     { en: 'View on Strava',       th: 'ดูบน Strava' },
  syncNow:          { en: 'Sync Now',             th: 'ซิงค์เดี๋ยวนี้' },
  syncing:          { en: 'Syncing…',             th: 'กำลังซิงค์…' },

  // Manual log
  logManual:        { en: 'Log Manual',           th: 'บันทึกด้วยตนเอง' },

  // Milestone
  nextMilestone:    { en: 'Next Milestone',       th: 'เป้าหมายถัดไป' },
  progress:         { en: 'Progress',             th: 'ความคืบหน้า' },
  kmRemaining:      { en: 'km remaining',         th: 'กม. คงเหลือ' },
  resetProgress:    { en: 'Reset all progress to 0? This will delete all logged activities from the database.',
                      th: 'รีเซ็ตความคืบหน้าทั้งหมดเป็น 0? ซึ่งจะลบกิจกรรมทั้งหมดออกจากฐานข้อมูล' },

  // Weather
  conditionsToday:  { en: 'Conditions Today',     th: 'สภาพอากาศวันนี้' },

  // Routes page
  routeLibrary:     { en: 'Route Library',        th: 'คลังเส้นทาง' },
  allActivities:    { en: 'All Activities',       th: 'กิจกรรมทั้งหมด' },
  noActivities:     { en: 'No activities yet',    th: 'ยังไม่มีกิจกรรม' },
  addRoute:         { en: 'Add Route',            th: 'เพิ่มเส้นทาง' },
  distance:         { en: 'Distance',             th: 'ระยะทาง' },
  elevation:        { en: 'Elevation',            th: 'ความสูง' },
  duration:         { en: 'Duration',             th: 'ระยะเวลา' },
  pace:             { en: 'Pace',                 th: 'เพซ' },
  deleteActivity:   { en: 'Delete activity? This cannot be undone.',
                      th: 'ลบกิจกรรม? ไม่สามารถย้อนกลับได้' },

  // Gear page
  gearRoom:         { en: 'Gear Room',            th: 'ห้องอุปกรณ์' },
  myGear:           { en: 'My Gear',              th: 'อุปกรณ์ของฉัน' },
  noGear:           { en: 'No gear added yet',    th: 'ยังไม่มีอุปกรณ์' },
  addGear:          { en: 'Add Gear',             th: 'เพิ่มอุปกรณ์' },
  totalMileage:     { en: 'Total Mileage',        th: 'ระยะทางรวม' },
  lifespan:         { en: 'Lifespan',             th: 'อายุการใช้งาน' },
  setDefault:       { en: 'Set as Default',       th: 'ตั้งเป็นค่าเริ่มต้น' },
  editGear:         { en: 'Edit',                 th: 'แก้ไข' },

  // Common
  save:             { en: 'Save',                 th: 'บันทึก' },
  cancel:           { en: 'Cancel',               th: 'ยกเลิก' },
  delete:           { en: 'Delete',               th: 'ลบ' },
  edit:             { en: 'Edit',                 th: 'แก้ไข' },
  close:            { en: 'Close',                th: 'ปิด' },
  loading:          { en: 'Loading…',             th: 'กำลังโหลด…' },
} satisfies Record<string, Record<Lang, string>>

export type TranslationKey = keyof typeof dict

interface LanguageCtx {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageCtx>({
  lang: 'en',
  setLang: () => {},
  t: (key) => dict[key].en,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en')
  const t = (key: TranslationKey) => dict[key][lang]
  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}

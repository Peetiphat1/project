import { z } from 'zod'

export const routeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  distance: z.number().positive("Distance must be positive"),
  elevation: z.number().min(0, "Elevation cannot be negative"),
  terrain: z.enum(["Trail", "Road", "Technical", "Mixed"]),
  notes: z.string().optional(),
  isFavorite: z.boolean().default(false)
})

export type RouteInput = z.infer<typeof routeSchema>

export const gearSchema = z.object({
  brandModel: z.string().min(1, "Brand and Model is required"),
  dateAcquired: z.string().min(1, "Date acquired is required"),
  startingMileage: z.number().min(0, "Starting mileage cannot be negative"),
  targetLifespan: z.number().positive("Target lifespan must be positive"),
  status: z.enum(["Active", "Retired", "Retiring Soon", "Default"])
})

export type GearInput = z.infer<typeof gearSchema>

export const manualActivitySchema = z.object({
  name: z.string().min(1, "Activity name is required"),
  distanceKm: z.number().positive("Distance must be a positive number"),
  durationSec: z.number().int().nonnegative("Duration cannot be negative").default(0),
  elevationM: z.number().nonnegative().default(0),
  date: z.string().min(1, "Date is required"),
})

export type ManualActivityInput = z.infer<typeof manualActivitySchema>

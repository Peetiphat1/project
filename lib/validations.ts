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

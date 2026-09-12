"use client"
import { useAuth } from '@clerk/nextjs'
import { ConvexReactClient } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import React from 'react'
import { CONVEX_URL, isConvexConfigured } from '@/lib/env'


const convex = isConvexConfigured ? new ConvexReactClient(CONVEX_URL) : null
//Creates a Convex database client using your Convex deployment URL
//Null when env keys are missing (demo mode) — children render without DB.
//NOTE: ClerkProvider lives in src/app/layout.tsx (single owner). Do NOT
//add another one here — nested providers duplicate auth context.


const ConvexClientProvider = ({children}:{children:React.ReactNode}) => {
  if (!convex) {
    return <>{children}</>;
  }
  return (
    // Database Integration: ConvexProviderWithClerk connects Convex database with Clerk auth
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
            {children}
        </ConvexProviderWithClerk>
  )
}

export default ConvexClientProvider
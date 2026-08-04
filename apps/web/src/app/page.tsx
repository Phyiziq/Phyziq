import Navbar from '@/components/Navbar'
import HeroSection from '@/components/HeroSection'
import DifferentiatorsSection from '@/components/DifferentiatorsSection'
import GymOwnerSection from '@/components/GymOwnerSection'
import DashboardPreview from '@/components/DashboardPreview'
import PricingSection from '@/components/PricingSection'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <DifferentiatorsSection />
        <GymOwnerSection />
        <DashboardPreview />
        <PricingSection />
      </main>
    </>
  )
}

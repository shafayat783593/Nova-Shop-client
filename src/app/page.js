import React from 'react'
import HeroSection from './Home/Herosection'
import FeaturedCategories from './Home/FeaturedCategories'
import TrendingProducts from './Home/Trendingproducts'
import { PromoBanner } from './Home/PromoBanner'

function page() {
  return (
    <div>
      <HeroSection/>
      <FeaturedCategories/>
      <PromoBanner/>
      <TrendingProducts/>
    
    </div>
  )
}

export default page

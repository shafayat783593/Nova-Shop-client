import React from 'react'
import HeroSection from './Home/Herosection'
import FeaturedCategories from './Home/FeaturedCategories'
import TrendingProducts from './Home/Trendingproducts'

function page() {
  return (
    <div>
      <HeroSection/>
      <FeaturedCategories/>
      <TrendingProducts/>
    </div>
  )
}

export default page

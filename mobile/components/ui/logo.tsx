import React from 'react'
import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import tw from '@/lib/tailwind'
import { Colors } from '@/constants/Theme'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  variant?: 'icon' | 'full'
}

const Logo = ({ size = 'md', showText = false, variant = 'icon' }: LogoProps) => {
  const sizeConfig = {
    sm: { container: 48, icon: 24, text: 16 },
    md: { container: 80, icon: 40, text: 24 },
    lg: { container: 120, icon: 60, text: 32 }
  }

  const config = sizeConfig[size]

  return (
    <View style={tw`items-center`}>
      {/* Logo Icon - Brand Purple */}
      <View style={[
        tw`items-center justify-center rounded-full`,
        {
          width: config.container,
          height: config.container,
          backgroundColor: Colors.brand.purple,
        }
      ]}>
        <Ionicons
          name="sparkles"
          size={config.icon}
          color={Colors.brand.white}
        />
      </View>

      {/* Optional Text */}
      {showText && (
        <Text style={[
          tw`font-sf-bold mt-4`,
          {
            fontSize: config.text,
            color: Colors.brand.black,
            letterSpacing: 1.5
          }
        ]}>
          YARA
        </Text>
      )}
    </View>
  )
}

export default Logo

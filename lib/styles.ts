// Common Tailwind style variables for consistent UI across the app

// Layout and container styles
export const backgroundGradient = "min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center p-4"
export const containerStyles = "bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 space-y-8"
export const containerStylesSmall = "bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 space-y-6"

// Input and form styles
export const inputStyles = "w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-slate-900"
export const textareaStyles = "w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none"
export const labelStyles = "block text-sm font-medium text-gray-700 mb-2"

// Button styles
export const buttonBaseStyles = "w-full font-semibold py-4 px-6 rounded-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
export const primaryButtonStyles = `${buttonBaseStyles} bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg`
export const secondaryButtonStyles = `${buttonBaseStyles} bg-white border-2 border-purple-600 text-purple-600 hover:bg-purple-50`
export const grayButtonStyles = `${buttonBaseStyles} bg-gray-600 hover:bg-gray-700 text-white`
export const smallButtonStyles = "px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"

// Status and feedback styles
export const errorStyles = "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
export const successStyles = "bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm"
export const infoStyles = "bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm"

// Text and typography
export const titleStyles = "text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
export const titleStylesLarge = "text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
export const subtitleStyles = "text-gray-600 text-sm"
export const smallTextStyles = "text-xs text-gray-500 text-center"

// Player and status indicators
export const playerCardStyles = "flex items-center justify-between p-4 bg-gray-50 rounded-lg"
export const avatarStyles = "w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold"
export const statusBadgeStyles = (isReady: boolean) => 
  `px-3 py-1 rounded-full text-sm font-medium ${
    isReady 
      ? 'bg-green-100 text-green-700' 
      : 'bg-yellow-100 text-yellow-700'
  }`

// Room code display
export const roomCodeContainerStyles = "bg-purple-100 rounded-xl p-4"
export const roomCodeTextStyles = "text-4xl font-mono font-bold text-purple-700"

// Form layouts
export const formSectionStyles = "space-y-3"
export const formFieldStyles = "space-y-4"

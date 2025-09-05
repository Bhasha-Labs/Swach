# SWACH Dashboard

A modern, real-time waste management monitoring dashboard built with Next.js, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Real-time Monitoring**: Live tracking of Swachata Index across multiple areas
- **Interactive Map**: Visual hotspot mapping with color-coded markers
- **Smart Analytics**: Area-wise leaderboard and performance comparison
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Modern UI**: Clean, professional interface with smooth animations
- **Time Filtering**: View data for today or past week
- **Red Flag Alerts**: Immediate identification of critical areas

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Heroicons
- **Maps**: Leaflet.js
- **Charts**: Recharts (ready for future implementations)
- **Build Tool**: Next.js built-in bundler

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd swach-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
swach-dashboard/
├── app/                 # Next.js app directory
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Main dashboard page
├── components/         # Reusable components
│   ├── HotspotMap.tsx     # Interactive map component
│   ├── AreaLeaderboard.tsx # Leaderboard component
│   └── PlaceComparison.tsx # Area comparison tool
├── utils/              # Utility functions
│   └── swachataUtils.ts   # Swachata Index calculations
├── public/             # Static assets
└── ...config files
```

## 🎯 Core Components

### Dashboard (Main Page)
- Real-time data visualization
- Time period filtering (Today/Past Week)
- Grid-based responsive layout
- Quick statistics overview

### Red Flag Areas
- Identifies areas with Swachata Index < 60
- Color-coded severity indicators
- Real-time status updates

### Hotspot Map
- Interactive Leaflet.js map
- Color-coded markers based on cleanliness scores
- Popup information for each area
- Dynamic legend

### Area Leaderboard
- Top 3 cleanest areas
- Top 3 areas needing attention
- Trend indicators and timestamps
- Performance grades

### Place Comparison
- Compare up to 3 areas simultaneously
- Visual progress bars
- Comparison summary statistics
- Interactive selection interface

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file for custom configuration:
```env
NEXT_PUBLIC_MAP_CENTER_LAT=28.6139
NEXT_PUBLIC_MAP_CENTER_LNG=77.2090
NEXT_PUBLIC_MAP_ZOOM=12
```

### Swachata Index Grading
The system uses a comprehensive grading scale:
- **A+ (95-100)**: Pristine condition
- **A (85-94)**: Very Good - Clean
- **B+ (75-84)**: Good - Mostly Clean
- **B (65-74)**: Fair - Some Issues
- **C+ (55-64)**: Moderate - Noticeable Litter
- **C (45-54)**: Poor - Significant Garbage
- **D+ (35-44)**: Bad - Heavy Pollution
- **D (25-34)**: Very Bad - Severe Issues
- **F+ (15-24)**: Critical - Environmental Hazard
- **F (0-14)**: Catastrophic - Immediate Action Required

## 🚀 Deployment

### Build for Production
```bash
npm run build
npm start
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm run build
# Upload 'out' directory to Netlify
```

## 🔄 Data Integration

The dashboard is designed to work with real-time data. To integrate your data source:

1. **Update the API endpoint** in `app/page.tsx`
2. **Modify the data interface** in the same file
3. **Adjust the mock data** to match your data structure

Example data structure:
```typescript
interface AreaData {
  id: string
  name: string
  swachataIndex: number
  trend: 'up' | 'down' | 'stable'
  lastUpdated: string
  coordinates: [number, number]
}
```

## 🎨 Customization

### Colors
Modify `tailwind.config.js` to change the color scheme:
```javascript
colors: {
  swach: {
    // Your custom green shades
  },
  danger: {
    // Your custom red shades
  }
}
```

### Layout
Update `app/page.tsx` to modify the dashboard layout and add new sections.

## 📱 Responsive Design

The dashboard is fully responsive with breakpoints:
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🧪 Testing

```bash
# Run linting
npm run lint

# Build test
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code comments

---

**Built with ❤️ for a cleaner, smarter world** 
# App Store Optimization Expert Agent

## Overview

The ASO Expert agent is an autonomous specialist focused on App Store Optimization for iOS App Store and Google Play Store. It maximizes app visibility, conversion rates, and organic downloads through data-driven keyword research, metadata optimization, and visual asset strategy.

## Purpose

App Store Optimization is crucial for organic app growth. With millions of apps competing for attention, this agent automates the ASO workflow, enabling:

- **Keyword Discovery**: Find high-impact, low-competition keywords
- **Metadata Optimization**: Craft compelling, keyword-rich listings
- **Visual Strategy**: Design high-converting screenshots and previews
- **Continuous Testing**: A/B test all elements for improvement

## Capabilities

| Capability | Description |
|------------|-------------|
| Keyword Research | Find and prioritize keywords by volume and competition |
| Metadata Optimization | Optimize titles, descriptions, and keywords |
| Visual Strategy | Plan screenshot sequences and preview videos |
| Competitive Analysis | Monitor and learn from competitors |
| A/B Testing | Design and analyze store listing experiments |
| Localization | Optimize for international markets |

## Required Skills

This agent operates primarily through domain knowledge and integrates with ASO platforms and store consoles directly. It does not require specific skills but can leverage:

- `app-store-connect` - iOS metadata management
- `google-play-console` - Android metadata management
- `mobile-analytics` - Performance tracking

## Processes That Use This Agent

- **App Store Optimization** (`app-store-optimization.js`)
- **iOS App Store Submission** (`ios-appstore-submission.js`) - metadata optimization
- **Android Play Store Publishing** (`android-playstore-publishing.js`) - listing optimization
- **Beta Testing Setup** (`beta-testing-setup.js`) - beta feedback analysis

## Workflow

### Phase 1: Research & Analysis

```
Input: App details, category, competitors
Output: Market analysis, keyword opportunities

Steps:
1. Analyze app category landscape
2. Research competitor keywords and strategies
3. Identify target audience search behavior
4. Establish baseline metrics
5. Define optimization goals
```

### Phase 2: Keyword Strategy

```
Input: Research findings
Output: Prioritized keyword list

Steps:
1. Generate keyword candidates
2. Analyze search volumes
3. Assess competition levels
4. Map keywords to metadata fields
5. Create targeting strategy
```

### Phase 3: Metadata Optimization

```
Input: Keyword strategy
Output: Optimized metadata

Steps:
1. Craft optimized app title
2. Write compelling subtitle/short description
3. Develop keyword-rich long description
4. Allocate iOS keyword field (100 chars)
5. Validate character limits and policies
```

### Phase 4: Visual Asset Strategy

```
Input: App features, target audience
Output: Screenshot and preview plan

Steps:
1. Plan screenshot sequence and messaging
2. Design app preview storyboard
3. Create icon variation concepts
4. Develop feature graphic guidelines
5. Plan A/B test variants
```

### Phase 5: Localization

```
Input: Target markets
Output: Localized metadata and keywords

Steps:
1. Identify priority markets
2. Research local keyword opportunities
3. Translate and adapt metadata
4. Localize visual assets
5. Plan market-specific tests
```

### Phase 6: Testing & Iteration

```
Input: Baseline metrics
Output: Optimized listing, test results

Steps:
1. Set up A/B tests in store consoles
2. Monitor test performance
3. Analyze results for significance
4. Implement winning variants
5. Plan next iteration
```

## Input Specification

```json
{
  "task": "aso_optimization",
  "platform": "ios",
  "appId": "com.example.app",
  "category": "Productivity",
  "currentMetadata": {
    "title": "MyApp - Task Manager",
    "subtitle": "Stay organized daily",
    "keywords": "task,todo,productivity"
  },
  "competitors": [
    "com.todoist.app",
    "com.microsoft.todo"
  ],
  "targetMarkets": ["en-US", "de-DE"],
  "goals": {
    "targetKeywords": ["task manager", "to-do list"],
    "conversionTarget": "5%"
  }
}
```

## Output Specification

```json
{
  "success": true,
  "keywordStrategy": {
    "primary": [
      { "keyword": "task manager", "volume": 85000, "difficulty": 65 }
    ],
    "secondary": [...],
    "longTail": [...]
  },
  "metadataRecommendations": {
    "title": {
      "recommended": "MyApp: Task Manager & To-Do List",
      "rationale": "Includes top 2 keywords"
    },
    "subtitle": {
      "recommended": "Daily Planner & Productivity",
      "rationale": "Targets secondary keywords"
    }
  },
  "visualStrategy": {
    "screenshotSequence": [
      { "position": 1, "message": "Get organized in seconds" },
      { "position": 2, "message": "Smart task management" }
    ]
  },
  "estimatedImpact": {
    "organicInstallIncrease": "+40%",
    "conversionRateTarget": "5%"
  }
}
```

## Decision Logic

### Keyword Selection

| Volume | Competition | Action |
|--------|-------------|--------|
| High | Low | Priority target |
| High | High | Long-term target |
| Medium | Low | Quick win |
| Low | Low | Niche opportunity |
| Low | High | Skip |

### Metadata Placement

| Field | Priority | Purpose |
|-------|----------|---------|
| Title | Highest weight | Primary keyword |
| Subtitle (iOS) | High weight | Secondary keywords |
| Keywords (iOS) | Medium weight | Long-tail keywords |
| Description | Lower weight | Engagement + keywords |

### Test Prioritization

| Element | Impact | Test Duration |
|---------|--------|---------------|
| Icon | High | 7+ days |
| First 2 screenshots | High | 14+ days |
| Title | High | 7+ days |
| All screenshots | Medium | 14+ days |
| Description | Lower | 7+ days |

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Keyword stuffing | Over-optimization | Balance keywords with readability |
| Policy rejection | Guideline violation | Review store policies |
| No test significance | Insufficient traffic | Extend test duration |
| Ranking drop | Algorithm change | Analyze and adapt |

### Recovery Strategy

```
1. Review store rejection reasons
2. Analyze metric changes
3. Revert problematic changes if needed
4. Adjust strategy based on data
5. Document learnings
```

## Integration

### With Other Agents

```
aso-expert
    |
    +-- ios-native-expert (iOS store requirements)
    +-- android-native-expert (Android store requirements)
    +-- mobile-ux-engineer (visual asset design)
    +-- mobile-devops (release coordination)
```

## Usage Example

### Direct Agent Call

```javascript
const task = defineTask({
  name: 'optimize-store-listing',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: 'Optimize app store listing',
      agent: {
        name: 'aso-expert',
        prompt: {
          role: 'Senior ASO Manager',
          task: 'Optimize app store listing for maximum organic growth',
          context: {
            platform: 'ios',
            appId: 'com.example.app',
            category: 'Productivity',
            competitors: ['com.todoist', 'com.any.do']
          },
          instructions: [
            'Research top keywords in productivity category',
            'Analyze competitor keyword strategies',
            'Optimize title with primary keyword',
            'Craft subtitle with secondary keywords',
            'Develop screenshot sequence strategy',
            'Create A/B test plan for icon and screenshots',
            'Provide localization recommendations for top 5 markets'
          ]
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## Best Practices

1. **Data First**: Base all decisions on research and analytics
2. **Test Everything**: Never assume - always A/B test changes
3. **Monitor Constantly**: Track rankings and conversion daily
4. **Learn from Competitors**: Analyze what works in your category
5. **Localize Properly**: Research keywords per market, don't just translate
6. **Iterate Continuously**: ASO is ongoing, not one-time

## Platform-Specific Notes

### iOS App Store
- Keywords field: 100 characters, comma-separated
- Promotional text: Can be changed without review
- Product Page Optimization for A/B testing
- App Previews: Up to 3 per localization

### Google Play Store
- No dedicated keyword field (uses title + description)
- Short description: 80 characters
- Store Listing Experiments for A/B testing
- Feature graphic required for promotion

## Related Resources

- Process: `app-store-optimization.js`
- [App Store Marketing Guidelines](https://developer.apple.com/app-store/marketing/guidelines/)
- [Google Play Store Listing Guidelines](https://support.google.com/googleplay/android-developer/answer/9898842)
- [Apple Search Ads](https://searchads.apple.com/)
- [Google App Campaigns](https://ads.google.com/home/campaigns/app-campaigns/)

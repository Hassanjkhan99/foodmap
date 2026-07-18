# FoodMap — Copy Deck

Voice: calm, plain, action-first. Short while moving. Never alarmist. Never implies the phone
holder is the driver. Placeholders in `{braces}`.

## Buttons / actions

| Key | Copy |
|---|---|
| `cta.continue` | Continue |
| `cta.startRadar` | Start Food Radar |
| `cta.startRoute` | Along a Route |
| `cta.allowLocation` | Allow location |
| `cta.useManualArea` | Pick an area instead |
| `cta.tryDemo` | Try demo mode |
| `cta.navigate` | Navigate |
| `cta.viewMenu` | View menu |
| `cta.startPickup` | Start pickup |
| `cta.call` | Call |
| `cta.reportIncorrect` | Report incorrect info |
| `cta.recenter` | Recenter |
| `cta.stop` | Stop |
| `cta.switchToAhead` | Ahead |
| `cta.switchToMap` | Map |
| `cta.resetSessionFilters` | Reset filters |
| `cta.saveAsDefault` | Save as default |
| `cta.copyAddress` | Copy address |
| `cta.enterPassenger` | I'm a passenger |

## Permission education

- **Title:** See what's ahead — with your location.
- **Body:** FoodMap uses your location **only while a session is open**, to show restaurants
  you're about to pass. It never runs in the background.
- **Primary:** Allow location · **Secondary:** Pick an area instead

## Permission denied / unsupported

- **Denied title:** Location is off
- **Denied body:** No problem — pick an area to explore, or turn location on in your device
  settings when you're ready.
- **Unsupported body:** This device can't share location with FoodMap. You can still pick an
  area to explore.

## Acquiring / GPS

- **Acquiring:** Finding you…
- **Slow acquire:** Still finding you. You can pick an area while we wait.
- **Weak GPS:** Weak GPS — showing your last good results. We'll refresh when the signal
  improves.
- **Heading unknown:** Getting your direction — showing everything nearby for now.

## Empty / filtered

- **No results title:** Nothing worth stopping for just ahead
- **No results body:** Keep going, or widen your distance or time.
- **All filtered title:** Your filters hid everything ahead
- **All filtered body:** Relax a filter to see more.  · **Action:** Reset filters

## Degraded banners (one line + one action)

| Status | Banner |
|---|---|
| Offline | You're offline — showing what we already have. |
| Places unavailable | Extra results are unavailable — showing our own venues. |
| Routes unavailable | Couldn't build the route — switch to Food Radar? |
| Map unavailable | Map didn't load — here's your list of what's ahead. |
| Details unavailable | Couldn't load extra details — you can still navigate. |
| Detour unavailable | Detour time isn't available for this one. |
| Delivery link unavailable | Menu link is unavailable right now — you can still navigate. |
| Stale | These results may be a little old — refresh when it's safe. |
| Feature disabled | This is temporarily unavailable. |

## Errors (never expose internals)

- **Generic:** Something went wrong. Your session is safe — try again in a moment.
- **Route provider failure:** We couldn't reach the route service. Try Food Radar instead.

## Session

- **Stop confirm (only if needed):** Stop this session? We'll clear location tracking right
  away.
- **Summary:** You passed {servedCount} places and looked at {selectedCount}. (No location or
  names are stored.)

## Source / attribution

- **External-only note:** Info from {provider}. Ordering isn't available here.
- **Attribution:** Photo/data via {provider}{author?}.
- **Unknown field:** Not available

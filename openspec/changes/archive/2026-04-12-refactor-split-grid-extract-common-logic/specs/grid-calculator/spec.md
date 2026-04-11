## ADDED Requirements

### Requirement: Grid Calculator Module
The system SHALL provide a reusable grid calculator module for splitting geographic data into map blocks.

#### Scenario: Calculate block index from coordinates
- **WHEN** `getBlockIndex(lat, lng)` is called with valid coordinates within Taiwan bounds
- **THEN** it returns `{ row: number, col: number }` representing the block position

#### Scenario: Calculate block center
- **WHEN** `getBlockCenter(row, col)` is called with valid block indices
- **THEN** it returns `{ lat: number, lng: number }` representing the center point of that block

#### Scenario: Calculate block bounds
- **WHEN** `getBlockBounds(row, col)` is called with valid block indices
- **THEN** it returns an object with four corner coordinates: `northWest`, `northEast`, `southWest`, `southEast`

#### Scenario: Extract location info from address
- **WHEN** `extractLocationInfo(address)` is called with a valid Taiwan address
- **THEN** it returns `{ zipCode: string, city: string, district: string, road: string }`
- **AND** the address is normalized by removing newline characters before parsing

### Requirement: Taiwan Geographic Constants
The system SHALL define consistent geographic constants for Taiwan coverage area.

#### Scenario: Block size constant
- **WHEN** the module is imported
- **THEN** `BLOCK_SIZE` equals `0.0306959` (Wanhua district coordinate range)

#### Scenario: Taiwan bounds constant
- **WHEN** the module is imported
- **THEN** `TAIWAN_BOUNDS` contains:
- `minLat: 21.903126`
- `maxLat: 26.3758`
- `minLng: 118.2257211`
- `maxLng: 121.948`

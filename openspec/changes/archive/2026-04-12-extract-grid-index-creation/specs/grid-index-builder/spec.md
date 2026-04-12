## ADDED Requirements

### Requirement: Unified Grid Block Interface
The system SHALL provide a type definition for the unified grid block structure.

#### Scenario: IGridBlock structure
- **WHEN** the module is imported
- **THEN** `IGridBlock` interface is exported with properties:
- `fileName: string` - Block file name (format: `{lng}_{lat}.json`)
- `center: { lat: number; lng: number }` - Block center coordinates
- `bounds: IBounds` - Block boundary coordinates
- `dataset: Record<string, IDatasetEntry>` - Dataset entries by type
- `locations: string[]` - Shared location strings (max 20)

#### Scenario: IDatasetEntry structure
- **WHEN** accessing dataset entry
- **THEN** it contains:
- `fileName: string` - Data type file path
- `count: number` - Number of items in this block

### Requirement: Block Aggregator with Multi-Dataset Support
The system SHALL provide a factory function `createBlockAggregator()` that supports multiple data types.

#### Scenario: Create aggregator with grid utils
- **WHEN** `createBlockAggregator(gridUtils)` is called with grid utils module
- **THEN** it returns an aggregator with methods: `add()`, `build()`, `merge()`

#### Scenario: Add item with data type
- **WHEN** `aggregator.add(item, { type: "wifi" })` is called
- **THEN** it creates or updates a block entry for that geographic location
- **AND** it increments the count for that data type
- **AND** it merges locations with existing entries (union)

#### Scenario: Add item to existing block
- **WHEN** adding an item to a block that already contains another data type
- **THEN** it adds a new entry to the `dataset` object
- **AND** it merges `locations` from both data types

### Requirement: Build Unified Index Table
The system SHALL provide a method to convert aggregated blocks into the unified index format.

#### Scenario: Build index with unified format
- **WHEN** `aggregator.build()` is called
- **THEN** it returns an array of `IGridBlock` sorted by center coordinates
- **AND** each block contains all dataset types for that geographic area
- **AND** locations are deduplicated and limited to 20 entries

### Requirement: Merge Multiple Aggregators
The system SHALL provide a function to merge multiple aggregators.

#### Scenario: Merge wifi and charging aggregators
- **WHEN** `mergeAggregators(wifiAgg, chargingAgg)` is called
- **THEN** it returns a new aggregator with combined blocks
- **AND** blocks with same location merge their datasets and locations

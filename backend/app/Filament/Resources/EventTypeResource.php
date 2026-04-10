<?php

namespace App\Filament\Resources;

use App\Filament\Resources\EventTypeResource\Pages;
use App\Models\EventType;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Grid;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\BooleanColumn;
use Filament\Tables\Columns\NumberColumn;
use Filament\Actions\EditAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\ViewAction;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;

class EventTypeResource extends Resource
{
    protected static ?string $model = EventType::class;
    protected static ?string $navigationLabel = 'Types d\'événements';
    protected static ?string $modelLabel = 'Type d\'événement';
    protected static ?string $pluralModelLabel = 'Types d\'événements';
    protected static string|\UnitEnum|null $navigationGroup = 'Configuration';

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Informations')
                    ->description('Détails du type d\'événement')
                    ->schema([
                        TextInput::make('title')
                            ->label('Titre')
                            ->required()
                            ->maxLength(255)
                            ->unique(ignoreRecord: true),
                        Textarea::make('description')
                            ->label('Description')
                            ->rows(3),
                        Grid::make(2)
                            ->schema([
                                Toggle::make('is_active')
                                    ->label('Actif')
                                    ->default(true),
                                TextInput::make('sort_order')
                                    ->label('Ordre')
                                    ->numeric()
                                    ->default(0),
                            ]),
                    ])->columns(1),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('title')
                    ->label('Titre')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('description')
                    ->label('Description')
                    ->limit(50),
                BooleanColumn::make('is_active')
                    ->label('Actif')
                    ->sortable(),
                NumberColumn::make('sort_order')
                    ->label('Ordre')
                    ->sortable(),
            ])
            ->filters([
                //
            ])
            ->actions([
                ViewAction::make(),
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->bulkActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListEventTypes::route('/'),
            'create' => Pages\CreateEventType::route('/create'),
            'edit' => Pages\EditEventType::route('/{record}/edit'),
        ];
    }
}

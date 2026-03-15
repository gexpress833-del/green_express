<?php

namespace App\Filament\Resources;

use App\Models\Menu;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\FileUpload;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Actions\EditAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\ViewAction;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;

class MenuResource extends Resource
{
    protected static ?string $model = Menu::class;

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Informations du menu')
                    ->description('Détails du plat')
                    ->schema([
                        TextInput::make('title')
                            ->label('Titre')
                            ->required()
                            ->maxLength(255),
                        Textarea::make('description')
                            ->label('Description')
                            ->rows(3),
                        Select::make('created_by')
                            ->label('Chef')
                            ->relationship('creator', 'name')
                            ->searchable()
                            ->preload(),
                    ])->columns(1),
                Section::make('Prix et devise')
                    ->schema([
                        TextInput::make('price')
                            ->label('Prix')
                            ->numeric()
                            ->required()
                            ->step(0.01),
                        Select::make('currency')
                            ->label('Devise')
                            ->options([
                                'USD' => 'USD ($)',
                                'CDF' => 'CDF (FC)',
                            ])
                            ->required()
                            ->default('USD'),
                    ])->columns(2),
                Section::make('Statut et disponibilité')
                    ->schema([
                        Select::make('status')
                            ->label('Statut')
                            ->options([
                                'draft' => 'Brouillon',
                                'pending' => 'En attente',
                                'approved' => 'Approuvé',
                                'rejected' => 'Rejeté',
                            ])
                            ->required()
                            ->default('draft'),
                        DateTimePicker::make('available_from')
                            ->label('Disponible à partir du'),
                        DateTimePicker::make('available_to')
                            ->label('Disponible jusqu\'au'),
                    ])->columns(2),
                Section::make('Image du menu')
                    ->schema([
                        FileUpload::make('image')
                            ->label('Image')
                            ->image()
                            ->disk('public')
                            ->directory('menus')
                            ->visibility('public')
                            ->hint('Formats: JPG, PNG (Max: 2MB)'),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('title')
                    ->label('Titre')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('creator.name')
                    ->label('Chef')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('status')
                    ->label('Statut')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'draft' => 'gray',
                        'pending' => 'warning',
                        'approved' => 'success',
                        'rejected' => 'danger',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'draft' => 'Brouillon',
                        'pending' => 'En attente',
                        'approved' => 'Approuvé',
                        'rejected' => 'Rejeté',
                        default => $state,
                    })
                    ->sortable(),
                Tables\Columns\TextColumn::make('price')
                    ->label('Prix')
                    ->money(function (Menu $record) {
                        return $record->currency;
                    })
                    ->sortable(),
                Tables\Columns\TextColumn::make('currency')
                    ->label('Devise')
                    ->sortable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Créé le')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options([
                        'draft' => 'Brouillon',
                        'pending' => 'En attente',
                        'approved' => 'Approuvé',
                        'rejected' => 'Rejeté',
                    ]),
            ])
            ->actions([
                ViewAction::make()
                    ->url(fn (Menu $record): string => static::getUrl('view', ['record' => $record])),
                EditAction::make()
                    ->url(fn (Menu $record): string => static::getUrl('edit', ['record' => $record])),
                DeleteAction::make()
                    ->requiresConfirmation()
                    ->action(fn (Menu $record) => $record->delete()),
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
            'index' => \App\Filament\Resources\MenuResource\Pages\ListMenus::route('/'),
            'create' => \App\Filament\Resources\MenuResource\Pages\CreateMenu::route('/create'),
            'view' => \App\Filament\Resources\MenuResource\Pages\ViewMenu::route('/{record}'),
            'edit' => \App\Filament\Resources\MenuResource\Pages\EditMenu::route('/{record}/edit'),
        ];
    }
}

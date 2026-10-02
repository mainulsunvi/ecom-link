/**
 * Provider Registry - Central registry for eCommerce providers
 *
 * This module manages the registration and retrieval of platform providers.
 * The registry maintains a map of provider instances and provides methods
 * to register new providers, retrieve them by ID, and list all available providers.
 */

import type { EcommerceProvider } from "./types"
import { ProviderNotFoundError } from "./types"

// ============================================================================
// Registry State
// ============================================================================

/**
 * Internal registry map
 * Stores provider instances by their unique ID
 */
const providerRegistry = new Map<string, EcommerceProvider>()

// ============================================================================
// Registry Functions
// ============================================================================

/**
 * Register a new provider
 * Adds a provider to the registry, making it available for use
 *
 * @param provider - Provider instance to register
 * @throws Error if provider with same ID already exists
 */
export function registerProvider(provider: EcommerceProvider<boolean>): void {
  if (providerRegistry.has(provider.id)) {
    throw new Error(
      `Provider "${provider.id}" is already registered. Each provider must have a unique ID.`
    )
  }
  providerRegistry.set(provider.id, provider)
}

/**
 * Get a provider by ID
 * Retrieves a registered provider instance
 *
 * @param id - Provider ID to retrieve
 * @returns Provider instance
 * @throws ProviderNotFoundError if provider is not registered
 */
export function getProvider(id: string): EcommerceProvider<boolean> {
  const provider = providerRegistry.get(id)
  if (!provider) {
    throw new ProviderNotFoundError(id)
  }
  return provider
}

/**
 * List all registered providers
 * Returns an array of all available provider instances
 *
 * @returns Array of provider instances
 */
export function listProviders(): EcommerceProvider<boolean>[] {
  return Array.from(providerRegistry.values())
}

/**
 * Check if a provider is registered
 * Utility function to check provider existence without throwing
 *
 * @param id - Provider ID to check
 * @returns true if provider is registered, false otherwise
 */
export function hasProvider(id: string): boolean {
  return providerRegistry.has(id)
}

/**
 * Clear all registered providers
 * Primarily used for testing
 *
 * WARNING: This removes all providers from the registry
 */
export function clearProviders(): void {
  providerRegistry.clear()
}

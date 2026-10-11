/**
 * ConnectionPage: full-page form for adding or editing a store connection.
 *
 * This replaces the modal-based flow with a dedicated page view, providing
 * more space and a better user experience in the small plugin window.
 */

import { useState } from "react"
import { Switch } from "../components/ui/Switch"
import { HelpTooltip } from "../components/ui/HelpTooltip"
import { Field } from "../components/ui/Field"
import { Card } from "../components/ui/Card"
import {
  CredentialFields,
  type CredentialErrors,
  type CredentialValues,
} from "../components/connection/CredentialFields"
import { CorsError, RateLimitError } from "../providers"
import {
  checkConnectionWriteAccess,
  normalizeStoreUrl,
  saveConnection,
  ConnectionValidationError,
  type ConnectionRecord,
  type KeyScope,
  type ValidationState,
} from "../storage/connections"

import connectionPageStyles from "../assets/styles/module/ConnectionPage.module.css"

/** Friendly labels for validation states. */
export const CONNECTION_STATE_LABELS: Record<ValidationState, string> = {
  valid: "Connected",
  invalid: "Connection failed",
  unvalidated: "Not checked yet",
}

/** Friendly labels for key scopes. */
export const KEY_SCOPE_LABELS: Record<KeyScope, string> = {
  read: "Read only",
  read_write: "Read and write",
}

/**
 * Turn any thrown error into one actionable sentence.
 */
export function formatErrorSentence(error: unknown): string {
  if (error instanceof RateLimitError) {
    return "The store is limiting requests right now. Wait a moment, then try again."
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return "Something went wrong. Try again."
}

interface ConnectionPageProps {
  /** Connection being edited, or null when adding a new one. */
  connection: ConnectionRecord | null
  onBack: () => void
  /** Called with the saved record so the dashboard can refresh. */
  onSaved: (record: ConnectionRecord) => void
}

/** Render the connect/edit connection page with validation feedback. */
export function ConnectionPage({
  connection,
  onBack,
  onSaved,
}: ConnectionPageProps) {
  const [values, setValues] = useState<CredentialValues>({
    storeUrl: connection?.storeUrl ?? "",
    consumerKey: "",
    consumerSecret: "",
  })
  const [keyScope, setKeyScope] = useState<KeyScope>(
    connection?.keyScope ?? "read"
  )
  const [companionUrl, setCompanionUrl] = useState(
    connection?.companionPluginUrl ?? ""
  )
  const [errors, setErrors] = useState<CredentialErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [failureMessage, setFailureMessage] = useState<string | null>(null)
  const [corsBlocked, setCorsBlocked] = useState(false)
  const [savedRecord, setSavedRecord] = useState<ConnectionRecord | null>(null)
  const [writeBlocked, setWriteBlocked] = useState(false)

  function handleChange(name: keyof CredentialValues, value: string) {
    setValues(function update(previous) {
      return { ...previous, [name]: value }
    })
  }

  function handleTwoWayChange(next: boolean) {
    setKeyScope(next ? "read_write" : "read")
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setFailureMessage(null)
    setCorsBlocked(false)
    setWriteBlocked(false)

    try {
      const record = await saveConnection({
        providerId: "woocommerce",
        storeUrl: values.storeUrl,
        consumerKey: values.consumerKey,
        consumerSecret: values.consumerSecret,
        keyScope,
        companionPluginUrl: companionUrl,
      })
      setSavedRecord(record)

      if (keyScope === "read_write" && companionUrl) {
        try {
          await checkConnectionWriteAccess({
            storeUrl: record.storeUrl,
            consumerKey: values.consumerKey || record.consumerKeyMasked,
            consumerSecret: values.consumerSecret || "••••••••",
            companionPluginUrl: companionUrl,
          })
        } catch (probeError) {
          if (probeError instanceof CorsError) {
            setWriteBlocked(true)
          }
        }
      }

      onSaved(record)
    } catch (error) {
      if (error instanceof CorsError) {
        setCorsBlocked(true)
        setFailureMessage(
          "The browser blocked the request. Install the companion plugin or enable CORS on your store."
        )
      } else if (error instanceof ConnectionValidationError) {
        if (error.fieldErrors) {
          setErrors(error.fieldErrors)
        }
        setFailureMessage(formatErrorSentence(error))
      } else {
        setFailureMessage(formatErrorSentence(error))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const isEdit = connection !== null
  const pageTitle = isEdit ? "Edit Connection" : "Connect Store"

  return (
      <div className={connectionPageStyles.connectionPage}>
          <header className={connectionPageStyles.pageHeader}>
              <button
                  type='button'
                  className='btn btn-ghost-icon'
                  onClick={onBack}
                  disabled={submitting}>
                  ←
              </button>
              <h1 className={connectionPageStyles.pageTitle}>{pageTitle}</h1>
          </header>

          <form
              className={connectionPageStyles.connectionPageForm}
              onSubmit={handleSubmit}>
              <h2 className={connectionPageStyles.sectionTitle}>
                  Store Details
                  <HelpTooltip text='Where your WooCommerce store lives.' />
              </h2>
              <Card>
                  <Card.Section>
                      <Field
                          id='storeUrl'
                          label='Store URL'
                          value={values.storeUrl}
                          onChange={(value) => handleChange('storeUrl', value)}
                          type='url'
                          placeholder='https://store.example.com'
                          helpText='The full URL of your WooCommerce store.'
                          error={errors.storeUrl}
                          disabled={submitting}
                          autoComplete='url'
                      />
                  </Card.Section>
              </Card>

              <div className={connectionPageStyles.formSection}>
                  <h2 className={connectionPageStyles.sectionTitle}>
                      API Credentials
                      <HelpTooltip text='Generate these in WooCommerce → Settings → Advanced → REST API.' />
                  </h2>
                  <CredentialFields
                      values={values}
                      onChange={handleChange}
                      errors={errors}
                      disabled={submitting}
                      isEdit={isEdit}
                  />
              </div>

              <div className={connectionPageStyles.formSection}>
                  <div className='toggle-row'>
                      <span className={connectionPageStyles.sectionTitle}>
                          Two-way sync
                          <HelpTooltip text='Enable product updates from Framer to your store. Requires write permissions.' />
                      </span>
                      <Switch
                          checked={keyScope === 'read_write'}
                          onChange={handleTwoWayChange}
                          ariaLabel='Two-way sync'
                          disabled={submitting}
                      />
                  </div>

                  {keyScope === 'read_write' ? (
                      <Card>
                          <Card.Section>
                              <div className={connectionPageStyles.formSection}>
                                  <Field
                                      id='companionUrl'
                                      label='Companion plugin URL'
                                      value={companionUrl}
                                      onChange={(value) =>
                                          setCompanionUrl(value)
                                      }
                                      type='url'
                                      placeholder='https://store.example.com/wp-json/ecom-link/v1'
                                      helpText='The REST API endpoint of the companion WordPress plugin.'
                                      error={errors.companionUrl}
                                      disabled={submitting}
                                  />
                              </div>
                          </Card.Section>
                      </Card>
                  ) : null}
              </div>

              {failureMessage ? (
                  <div
                      className='notice notice-error'
                      role='alert'>
                      <h3 className='notice-title'>Connection failed</h3>
                      <p>{failureMessage}</p>
                  </div>
              ) : null}

              {corsBlocked ? (
                  <div
                      className='notice notice-warning'
                      role='status'>
                      <h3 className='notice-title'>
                          Connection Blocked by the Browser
                      </h3>
                      <p>
                          WooCommerce does not allow direct browser requests by
                          default. Install the free companion plugin to let the
                          plugin talk to your store.
                      </p>
                      <ol className='notice-steps'>
                          <li>
                              Download the companion plugin from the Ecom-Link
                              documentation.
                          </li>
                          <li>
                              Install and activate it on your WordPress site.
                          </li>
                          <li>
                              Copy the companion URL shown after activation and
                              paste it above.
                          </li>
                      </ol>
                  </div>
              ) : null}

              {writeBlocked ? (
                  <div
                      className='notice notice-warning'
                      role='status'>
                      <h3 className='notice-title'>Two-Way Sync Blocked</h3>
                      <p>
                          The companion plugin did not respond. Two-way sync
                          will not work until the endpoint is reachable.
                      </p>
                  </div>
              ) : null}

              {savedRecord ? (
                  <div
                      className='notice notice-success'
                      role='status'>
                      <h3 className='notice-title'>Connection saved</h3>
                      <p>
                          Your store is connected. You can now sync products
                          from your WooCommerce catalog.
                      </p>
                  </div>
              ) : null}

              <div className={connectionPageStyles.formActions}>
                  <button
                      type='button'
                      className='btn btn-secondary'
                      onClick={onBack}
                      disabled={submitting}>
                      Cancel
                  </button>
                  <button
                      type='submit'
                      className='btn btn-primary'
                      disabled={submitting}>
                      {submitting
                          ? 'Connecting...'
                          : isEdit
                            ? 'Save changes'
                            : 'Connect store'}
                  </button>
              </div>
          </form>
      </div>
  );
}

import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VehicleForm from './VehicleForm'

async function fillRequired() {
  await userEvent.type(screen.getByLabelText(/^make/i), 'Hyundai')
  await userEvent.type(screen.getByLabelText(/^model/i), 'Creta')
  await userEvent.type(screen.getByLabelText(/category/i), 'SUV')
  await userEvent.type(screen.getByLabelText(/price/i), '1450000')
  await userEvent.type(screen.getByLabelText(/quantity/i), '3')
}

describe('VehicleForm', () => {
  it('submits numbers as numbers, not strings', async () => {
    const onSubmit = vi.fn().mockResolvedValue()
    render(<VehicleForm onSubmit={onSubmit} onCancel={() => {}} />)

    await fillRequired()
    await userEvent.click(screen.getByRole('button', { name: /add vehicle/i }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ make: 'Hyundai', model: 'Creta', category: 'SUV', price: 1450000, quantity: 3 }),
    )
  })

  it('blocks submit and explains when required fields are missing', async () => {
    const onSubmit = vi.fn()
    render(<VehicleForm onSubmit={onSubmit} onCancel={() => {}} />)

    await userEvent.click(screen.getByRole('button', { name: /add vehicle/i }))

    expect(screen.getByRole('alert')).toHaveTextContent(/make, model, category and price are required/i)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('rejects a negative price', async () => {
    const onSubmit = vi.fn()
    render(<VehicleForm onSubmit={onSubmit} onCancel={() => {}} />)

    await fillRequired()
    await userEvent.clear(screen.getByLabelText(/price/i))
    await userEvent.type(screen.getByLabelText(/price/i), '-5')
    await userEvent.click(screen.getByRole('button', { name: /add vehicle/i }))

    expect(screen.getByRole('alert')).toHaveTextContent(/price can't be negative/i)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('prefills when editing and labels the button accordingly', () => {
    const car = { id: 4, make: 'Kia', model: 'Seltos', category: 'SUV', year: 2024, price: 1350000, quantity: 0, description: '' }
    render(<VehicleForm initial={car} onSubmit={() => {}} onCancel={() => {}} />)

    expect(screen.getByLabelText(/^model/i)).toHaveValue('Seltos')
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
  })

  it('shows a server error passed back from onSubmit', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('price: Input should be greater than or equal to 0'))
    render(<VehicleForm onSubmit={onSubmit} onCancel={() => {}} />)

    await fillRequired()
    await userEvent.click(screen.getByRole('button', { name: /add vehicle/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/greater than or equal to 0/)
  })
})

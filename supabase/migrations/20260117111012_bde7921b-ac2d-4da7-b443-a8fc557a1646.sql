-- Create transaction type enum
CREATE TYPE transaction_type AS ENUM ('income', 'expense');

-- Create transaction category enum  
CREATE TYPE transaction_category AS ENUM (
  'subscription', 'installation', 'other_income',
  'operational', 'salary', 'equipment', 'maintenance', 'other_expense'
);

-- Create financial transactions table
CREATE TABLE public.financial_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_type transaction_type NOT NULL,
  category transaction_category NOT NULL,
  amount BIGINT NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Allow all operations for authenticated users" 
ON public.financial_transactions 
FOR ALL 
USING (auth.role() = 'authenticated');

-- Create index for faster queries
CREATE INDEX idx_financial_transactions_date ON public.financial_transactions(transaction_date);
CREATE INDEX idx_financial_transactions_type ON public.financial_transactions(transaction_type);
CREATE INDEX idx_financial_transactions_category ON public.financial_transactions(category);

-- Create financial summary table for monthly reports
CREATE TABLE public.financial_summary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  total_income BIGINT NOT NULL DEFAULT 0,
  total_expense BIGINT NOT NULL DEFAULT 0,
  net_profit BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(month, year)
);

-- Enable RLS for financial summary
ALTER TABLE public.financial_summary ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Allow all operations for authenticated users" 
ON public.financial_summary 
FOR ALL 
USING (auth.role() = 'authenticated');

-- Create function to update financial summary
CREATE OR REPLACE FUNCTION public.update_financial_summary(p_month INTEGER, p_year INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_income BIGINT;
  v_total_expense BIGINT;
  v_net_profit BIGINT;
BEGIN
  -- Calculate total income for the month
  SELECT COALESCE(SUM(amount), 0) INTO v_total_income
  FROM public.financial_transactions
  WHERE transaction_type = 'income'
    AND EXTRACT(MONTH FROM transaction_date) = p_month
    AND EXTRACT(YEAR FROM transaction_date) = p_year;
  
  -- Calculate total expense for the month
  SELECT COALESCE(SUM(amount), 0) INTO v_total_expense
  FROM public.financial_transactions
  WHERE transaction_type = 'expense'
    AND EXTRACT(MONTH FROM transaction_date) = p_month
    AND EXTRACT(YEAR FROM transaction_date) = p_year;
  
  -- Calculate net profit
  v_net_profit := v_total_income - v_total_expense;
  
  -- Insert or update summary
  INSERT INTO public.financial_summary (month, year, total_income, total_expense, net_profit)
  VALUES (p_month, p_year, v_total_income, v_total_expense, v_net_profit)
  ON CONFLICT (month, year)
  DO UPDATE SET
    total_income = EXCLUDED.total_income,
    total_expense = EXCLUDED.total_expense,
    net_profit = EXCLUDED.net_profit,
    updated_at = now();
END;
$$;

-- Create trigger to auto-update summary on transaction changes
CREATE OR REPLACE FUNCTION public.trigger_update_financial_summary()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.update_financial_summary(
      EXTRACT(MONTH FROM OLD.transaction_date)::INTEGER,
      EXTRACT(YEAR FROM OLD.transaction_date)::INTEGER
    );
    RETURN OLD;
  ELSE
    PERFORM public.update_financial_summary(
      EXTRACT(MONTH FROM NEW.transaction_date)::INTEGER,
      EXTRACT(YEAR FROM NEW.transaction_date)::INTEGER
    );
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER financial_transaction_summary_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.financial_transactions
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_financial_summary();
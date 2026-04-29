SHELL := /bin/bash

.DEFAULT_GOAL := help

COMPOSE ?= docker compose
AUTH_SERVICE ?= auth-service
CORE_SERVICE ?= core-service

SCHOOL_ADMIN_EMAIL ?= school.admin@example.com
SCHOOL_ADMIN_PASSWORD ?= School123!

STUDENT_COUNT ?= 10
STUDENT_START_INDEX ?= 1
STUDENT_EMAIL_PREFIX ?= student
STUDENT_EMAIL_DOMAIN ?= example.com
STUDENT_FULL_NAME_PREFIX ?= MVP Student
STUDENT_PASSWORD ?= Student123!
STUDENT_LICENSE_CODE ?= B
STUDENT_DOCUMENT_PREFIX ?= DOC

STATS_ATTEMPTS ?= 20
STATS_QUESTION_COUNT ?= 30
STATS_START_DATE ?= 2026-04-19
STATS_END_DATE ?= 2026-04-26
STATS_RANDOM_SEED ?= 20260425

.PHONY: help up seed-questions seed-students seed-stats-all seed-all print-seed-config

help:
	@printf "Targets disponibles:\n"
	@printf "  make up                 # levanta auth/core y sus DBs\n"
	@printf "  make seed-questions     # carga banco de preguntas\n"
	@printf "  make seed-students      # crea alumnos reales\n"
	@printf "  make seed-stats-all     # genera historial para todos los alumnos del rango\n"
	@printf "  make seed-all           # hace todo junto\n"
	@printf "  make print-seed-config  # muestra la configuración efectiva\n"
	@printf "\nEjemplo:\n"
	@printf "  make seed-all STUDENT_COUNT=100 STUDENT_START_INDEX=1\n"

up:
	$(COMPOSE) up -d auth-db core-db auth-service core-service

print-seed-config:
	@printf "SCHOOL_ADMIN_EMAIL=%s\n" "$(SCHOOL_ADMIN_EMAIL)"
	@printf "STUDENT_COUNT=%s\n" "$(STUDENT_COUNT)"
	@printf "STUDENT_START_INDEX=%s\n" "$(STUDENT_START_INDEX)"
	@printf "STUDENT_EMAIL_PREFIX=%s\n" "$(STUDENT_EMAIL_PREFIX)"
	@printf "STUDENT_EMAIL_DOMAIN=%s\n" "$(STUDENT_EMAIL_DOMAIN)"
	@printf "STUDENT_FULL_NAME_PREFIX=%s\n" "$(STUDENT_FULL_NAME_PREFIX)"
	@printf "STUDENT_PASSWORD=%s\n" "$(STUDENT_PASSWORD)"
	@printf "STUDENT_LICENSE_CODE=%s\n" "$(STUDENT_LICENSE_CODE)"
	@printf "STATS_ATTEMPTS=%s\n" "$(STATS_ATTEMPTS)"
	@printf "STATS_QUESTION_COUNT=%s\n" "$(STATS_QUESTION_COUNT)"
	@printf "STATS_START_DATE=%s\n" "$(STATS_START_DATE)"
	@printf "STATS_END_DATE=%s\n" "$(STATS_END_DATE)"

seed-questions:
	$(COMPOSE) run --rm $(CORE_SERVICE) python scripts/seed_questions.py

seed-students:
	$(COMPOSE) run --rm $(AUTH_SERVICE) python scripts/seed_students.py \
		--school-admin-email "$(SCHOOL_ADMIN_EMAIL)" \
		--school-admin-password "$(SCHOOL_ADMIN_PASSWORD)" \
		--count "$(STUDENT_COUNT)" \
		--start-index "$(STUDENT_START_INDEX)" \
		--email-prefix "$(STUDENT_EMAIL_PREFIX)" \
		--email-domain "$(STUDENT_EMAIL_DOMAIN)" \
		--full-name-prefix "$(STUDENT_FULL_NAME_PREFIX)" \
		--student-password "$(STUDENT_PASSWORD)" \
		--license-code "$(STUDENT_LICENSE_CODE)" \
		--document-prefix "$(STUDENT_DOCUMENT_PREFIX)" \
		--print-emails-summary

seed-stats-all:
	@start_index=$(STUDENT_START_INDEX); \
	count=$(STUDENT_COUNT); \
	end_index=$$((start_index + count - 1)); \
	for i in $$(seq $$start_index $$end_index); do \
		email="$(STUDENT_EMAIL_PREFIX)$${i}@$(STUDENT_EMAIL_DOMAIN)"; \
		echo "==> Generando historial para $$email"; \
		$(COMPOSE) run --rm $(CORE_SERVICE) python scripts/seed_stats_history.py \
			--email "$$email" \
			--password "$(STUDENT_PASSWORD)" \
			--permit-code "$(STUDENT_LICENSE_CODE)" \
			--attempts "$(STATS_ATTEMPTS)" \
			--question-count "$(STATS_QUESTION_COUNT)" \
			--start-date "$(STATS_START_DATE)" \
			--end-date "$(STATS_END_DATE)" \
			--seed $$(( $(STATS_RANDOM_SEED) + i )); \
	done

seed-all: up seed-questions seed-students seed-stats-all

star <- Sys.time()

rmarkdown::clean_site()

rmarkdown::render_site(encoding = 'UTF-8')

end <- Sys.time()

end - start
